import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import path from 'path';
import { verifyAccessToken } from '../auth/PasswordUtil';

// Unicode TrueType fonts so Polish/Ukrainian glyphs (ł, ą, ż, ę, і, ї…) render.
// pdfkit's built-in Helvetica is WinAnsi-only and mangles them.
const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const FONT_REGULAR = path.join(FONT_DIR, 'Urbanist-Regular.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'Urbanist-Bold.ttf');
const F_REGULAR = 'Body';
const F_BOLD = 'Body-Bold';

const router = Router();
const prisma = new PrismaClient();

const BRAND = '#EC2828';
const INK = '#212121';
const MUTED = '#6B7280';

// --- i18n: report labels per language (matches the app's pl/en/ua) ---

type Lang = 'pl' | 'en' | 'ua';
const pickLang = (v: unknown): Lang =>
  v === 'pl' || v === 'ua' ? v : 'en';

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    reportKicker: 'Spot report',
    courierTitle: 'Courier earnings',
    ordersTitle: 'Daily orders',
    pointsTitle: 'Points awarded',
    courier: 'Courier', deliveries: 'Deliveries', earnings: 'Earnings', total: 'Total',
    noCourier: 'No courier earnings in this period.',
    order: 'Order', time: 'Time', items: 'Items', status: 'Status', orderTotal: 'Total',
    noOrders: 'No orders on this day.', ordersCount: 'orders', paidRevenue: 'Paid revenue',
    when: 'When', customer: 'Customer', reason: 'Reason', points: 'Points',
    noPoints: 'No points awarded at this spot in this period.', awards: 'awards',
    sessionsTitle: 'Staff login sessions', staff: 'Staff', role: 'Role', ip: 'IP',
    noSessions: 'No staff logins in this period.', logins: 'logins',
  },
  pl: {
    reportKicker: 'Raport punktu',
    courierTitle: 'Zarobki kurierów',
    ordersTitle: 'Zamówienia dzienne',
    pointsTitle: 'Przyznane punkty',
    courier: 'Kurier', deliveries: 'Dostawy', earnings: 'Zarobki', total: 'Razem',
    noCourier: 'Brak zarobków kurierów w tym okresie.',
    order: 'Zamówienie', time: 'Godzina', items: 'Pozycje', status: 'Status', orderTotal: 'Suma',
    noOrders: 'Brak zamówień tego dnia.', ordersCount: 'zamówień', paidRevenue: 'Przychód opłacony',
    when: 'Kiedy', customer: 'Klient', reason: 'Powód', points: 'Punkty',
    noPoints: 'Brak przyznanych punktów w tym punkcie w tym okresie.', awards: 'przyznań',
    sessionsTitle: 'Logowania personelu', staff: 'Pracownik', role: 'Rola', ip: 'IP',
    noSessions: 'Brak logowań personelu w tym okresie.', logins: 'logowań',
  },
  ua: {
    reportKicker: 'Звіт точки',
    courierTitle: 'Заробітки кур’єрів',
    ordersTitle: 'Щоденні замовлення',
    pointsTitle: 'Нараховані бали',
    courier: 'Кур’єр', deliveries: 'Доставки', earnings: 'Заробіток', total: 'Разом',
    noCourier: 'Немає заробітків кур’єрів за цей період.',
    order: 'Замовлення', time: 'Час', items: 'Позиції', status: 'Статус', orderTotal: 'Сума',
    noOrders: 'Немає замовлень цього дня.', ordersCount: 'замовлень', paidRevenue: 'Оплачений дохід',
    when: 'Коли', customer: 'Клієнт', reason: 'Причина', points: 'Бали',
    noPoints: 'За цей період на цій точці бали не нараховувались.', awards: 'нарахувань',
    sessionsTitle: 'Входи персоналу', staff: 'Працівник', role: 'Роль', ip: 'IP',
    noSessions: 'Немає входів персоналу за цей період.', logins: 'входів',
  },
};

// Fetch a spot's logo as an image buffer for embedding (null if none/failed).
async function fetchLogo(logoUrl: string | null | undefined): Promise<Buffer | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    // pdfkit only embeds PNG/JPEG.
    if (!/(png|jpe?g)/i.test(type) && !/\.(png|jpe?g)$/i.test(logoUrl)) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// --- Auth: require a logged-in staff member who can manage the spot ---

function requireAuth(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = verifyAccessToken(token);
    (req as any).userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Can the current user export reports for :spotId? (global admin or that spot's admin)
async function canManageSpot(userId: string, spotId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
  if (!user) return false;
  if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('SPOTS_ADMIN')) return true;
  const admin = await prisma.spotAdminProfile.findFirst({ where: { userId, spotId } });
  return !!admin;
}

// --- PDF helpers ---

const money = (v: number) => `${v.toFixed(2)} zł`;
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
const fmtDateTime = (d: Date) => `${fmtDate(d)} ${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;

// Parse a YYYY-MM-DD query param; defaults applied by caller.
const parseDay = (v: unknown, fallback: Date): Date => {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v);
  return fallback;
};

function startDoc(res: Response, filename: string): PDFKit.PDFDocument {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  // Embed Unicode fonts; fall back silently if the files are missing.
  try {
    doc.registerFont(F_REGULAR, FONT_REGULAR);
    doc.registerFont(F_BOLD, FONT_BOLD);
    doc.font(F_REGULAR);
  } catch {
    /* falls back to Helvetica (non-Unicode) */
  }
  doc.pipe(res);
  return doc;
}

function header(
  doc: PDFKit.PDFDocument,
  spotName: string,
  title: string,
  subtitle: string,
  t: Record<string, string>,
  logo: Buffer | null,
) {
  const top = doc.y;
  // Spot logo (top-right), if available.
  if (logo) {
    try {
      doc.image(logo, 547 - 56, top, { fit: [56, 56] });
    } catch {
      /* unreadable image — skip */
    }
  }
  doc.font(F_BOLD).fillColor(BRAND).fontSize(22).text('Gelato', 48, top, { continued: true });
  doc.font(F_REGULAR).fillColor(MUTED).fontSize(12).text(`  ${t.reportKicker}`);
  doc.moveDown(0.3);
  doc.font(F_BOLD).fillColor(INK).fontSize(16).text(title);
  doc.font(F_REGULAR).fillColor(MUTED).fontSize(10).text(`${spotName}  ·  ${subtitle}`);
  // Keep the divider below whichever is taller (text or logo).
  doc.y = Math.max(doc.y, top + 64);
  doc.strokeColor('#E5E7EB').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.8);
}

// A simple two+ column row.
function row(doc: PDFKit.PDFDocument, cols: string[], widths: number[], opts: { bold?: boolean; color?: string } = {}) {
  const y = doc.y;
  let x = 48;
  doc.font(opts.bold ? F_BOLD : F_REGULAR).fontSize(10).fillColor(opts.color ?? INK);
  cols.forEach((c, i) => {
    doc.text(c, x, y, { width: widths[i], lineBreak: false });
    x += widths[i];
  });
  doc.moveDown(0.6);
}

// ============================ Courier report ============================
/**
 * GET /reports/courier/:spotId?from=YYYY-MM-DD&to=YYYY-MM-DD&courierId=...
 * Per-courier deliveries + earnings at this spot.
 */
router.get('/courier/:spotId', requireAuth, async (req: Request, res: Response) => {
  const { spotId } = req.params;
  if (!(await canManageSpot((req as any).userId, spotId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const now = new Date();
  const from = parseDay(req.query.from, new Date(now.getFullYear(), now.getMonth(), 1));
  from.setHours(0, 0, 0, 0);
  const to = parseDay(req.query.to, now);
  to.setHours(23, 59, 59, 999);
  const courierId = typeof req.query.courierId === 'string' ? req.query.courierId : undefined;

  const t = STRINGS[pickLang(req.query.lang)];
  const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { name: true, logoUrl: true } });
  const logo = await fetchLogo(spot?.logoUrl);
  const earnings = await prisma.courierEarning.findMany({
    where: { spotId, date: { gte: from, lte: to }, ...(courierId ? { courierId } : {}) },
    include: { courier: { include: { user: true } } },
    orderBy: { date: 'asc' },
  });

  type Bucket = { name: string; deliveries: number; amount: number };
  const byCourier = new Map<string, Bucket>();
  let total = 0;
  for (const e of earnings) {
    total += e.amount;
    const u = e.courier.user;
    const name = u.name || [u.firstName, u.surname].filter(Boolean).join(' ') || u.email;
    const b = byCourier.get(e.courierId) ?? { name, deliveries: 0, amount: 0 };
    b.deliveries += 1;
    b.amount += e.amount;
    byCourier.set(e.courierId, b);
  }

  const doc = startDoc(res, `courier-report-${fmtDate(from)}_${fmtDate(to)}.pdf`);
  header(doc, spot?.name ?? spotId, t.courierTitle, `${fmtDate(from)} — ${fmtDate(to)}`, t, logo);

  row(doc, [t.courier, t.deliveries, t.earnings], [300, 100, 100], { bold: true, color: MUTED });
  doc.strokeColor('#F3F4F6').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  if (byCourier.size === 0) {
    doc.fillColor(MUTED).fontSize(10).text(t.noCourier);
  } else {
    for (const b of Array.from(byCourier.values()).sort((a, z) => z.amount - a.amount)) {
      row(doc, [b.name, String(b.deliveries), money(b.amount)], [300, 100, 100]);
    }
  }
  doc.moveDown(0.5);
  doc.strokeColor('#E5E7EB').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  row(doc, [t.total, String(earnings.length), money(total)], [300, 100, 100], { bold: true, color: BRAND });

  doc.end();
});

// ============================ Daily orders report ============================
/**
 * GET /reports/orders/:spotId?date=YYYY-MM-DD
 * All orders placed at this spot on a given day.
 */
router.get('/orders/:spotId', requireAuth, async (req: Request, res: Response) => {
  const { spotId } = req.params;
  if (!(await canManageSpot((req as any).userId, spotId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const day = parseDay(req.query.date, new Date());
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const t = STRINGS[pickLang(req.query.lang)];
  const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { name: true, logoUrl: true } });
  const logo = await fetchLogo(spot?.logoUrl);
  const orders = await prisma.order.findMany({
    where: { spotId, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'asc' },
    include: { items: true },
  });

  const paid = orders.filter((o) => o.paymentStatus === 'paid');
  const revenue = paid.reduce((s, o) => s + o.total, 0);

  const doc = startDoc(res, `orders-report-${fmtDate(day)}.pdf`);
  header(doc, spot?.name ?? spotId, t.ordersTitle, fmtDate(day), t, logo);

  row(doc, [t.order, t.time, t.items, t.status, t.orderTotal], [120, 90, 60, 130, 90], { color: MUTED });
  doc.strokeColor('#F3F4F6').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  if (orders.length === 0) {
    doc.fillColor(MUTED).fontSize(10).text(t.noOrders);
  } else {
    for (const o of orders) {
      const items = o.items.reduce((n, it) => n + it.quantity, 0);
      row(
        doc,
        [`#${o.orderNumber}`, fmtDateTime(o.createdAt).slice(11), String(items), String(o.status), money(o.total)],
        [120, 90, 60, 130, 90],
      );
    }
  }
  doc.moveDown(0.5);
  doc.strokeColor('#E5E7EB').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  row(doc, [`${orders.length} ${t.ordersCount}`, '', '', t.paidRevenue, money(revenue)], [120, 90, 60, 130, 90], { color: BRAND });

  doc.end();
});

// ============================ Points ledger report ============================
/**
 * GET /reports/points/:spotId?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Points awarded at this spot (referenceType 'spot'), i.e. which user got what.
 */
router.get('/points/:spotId', requireAuth, async (req: Request, res: Response) => {
  const { spotId } = req.params;
  if (!(await canManageSpot((req as any).userId, spotId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const now = new Date();
  const from = parseDay(req.query.from, new Date(now.getFullYear(), now.getMonth(), 1));
  from.setHours(0, 0, 0, 0);
  const to = parseDay(req.query.to, now);
  to.setHours(23, 59, 59, 999);

  const tr = STRINGS[pickLang(req.query.lang)];
  const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { name: true, logoUrl: true } });
  const logo = await fetchLogo(spot?.logoUrl);
  // Points awarded at this spot are stamped with referenceType 'spot' + referenceId = spotId.
  const txns = await prisma.pointTransaction.findMany({
    where: {
      referenceType: 'spot',
      referenceId: spotId,
      createdAt: { gte: from, lte: to },
    },
    include: { user: { select: { name: true, firstName: true, surname: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const total = txns.reduce((s, t) => s + t.amount, 0);

  const doc = startDoc(res, `points-report-${fmtDate(from)}_${fmtDate(to)}.pdf`);
  header(doc, spot?.name ?? spotId, tr.pointsTitle, `${fmtDate(from)} — ${fmtDate(to)}`, tr, logo);

  row(doc, [tr.when, tr.customer, tr.reason, tr.points], [110, 170, 150, 60], { color: MUTED });
  doc.strokeColor('#F3F4F6').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  if (txns.length === 0) {
    doc.fillColor(MUTED).fontSize(10).text(tr.noPoints);
  } else {
    for (const tx of txns) {
      const u = tx.user;
      const name = u.name || [u.firstName, u.surname].filter(Boolean).join(' ') || u.email;
      row(
        doc,
        [fmtDateTime(tx.createdAt), name, tx.description, `+${tx.amount}`],
        [110, 170, 150, 60],
      );
    }
  }
  doc.moveDown(0.5);
  doc.strokeColor('#E5E7EB').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  row(doc, [tr.total, `${txns.length} ${tr.awards}`, '', `+${total}`], [110, 170, 150, 60], { color: BRAND });

  doc.end();
});

// ============================ Staff sessions report ============================
/**
 * GET /reports/sessions/:spotId?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Staff login sessions at this spot in a date range.
 */
router.get('/sessions/:spotId', requireAuth, async (req: Request, res: Response) => {
  const { spotId } = req.params;
  if (!(await canManageSpot((req as any).userId, spotId))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const now = new Date();
  const from = parseDay(req.query.from, new Date(now.getFullYear(), now.getMonth(), 1));
  from.setHours(0, 0, 0, 0);
  const to = parseDay(req.query.to, now);
  to.setHours(23, 59, 59, 999);

  const t = STRINGS[pickLang(req.query.lang)];
  const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { name: true, logoUrl: true } });
  const logo = await fetchLogo(spot?.logoUrl);
  const sessions = await prisma.staffLoginSession.findMany({
    where: { spotId, loginAt: { gte: from, lte: to } },
    include: { user: { select: { name: true, firstName: true, surname: true, email: true } } },
    orderBy: { loginAt: 'desc' },
  });

  const doc = startDoc(res, `sessions-report-${fmtDate(from)}_${fmtDate(to)}.pdf`);
  header(doc, spot?.name ?? spotId, t.sessionsTitle, `${fmtDate(from)} — ${fmtDate(to)}`, t, logo);

  row(doc, [t.when, t.staff, t.role, t.ip], [140, 180, 110, 110], { color: MUTED });
  doc.strokeColor('#F3F4F6').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  if (sessions.length === 0) {
    doc.fillColor(MUTED).fontSize(10).text(t.noSessions);
  } else {
    for (const s of sessions) {
      const u = s.user;
      const name = u.name || [u.firstName, u.surname].filter(Boolean).join(' ') || u.email;
      row(
        doc,
        [fmtDateTime(s.loginAt), name, s.role, s.ipAddress ?? '—'],
        [140, 180, 110, 110],
      );
    }
  }
  doc.moveDown(0.5);
  doc.strokeColor('#E5E7EB').moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.4);
  row(doc, [t.total, `${sessions.length} ${t.logins}`, '', ''], [140, 180, 110, 110], { bold: true, color: BRAND });

  doc.end();
});

export default router;
