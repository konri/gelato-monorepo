import type { LocalizedText } from '../tastes/types';

export type Prize = {
  id: string;
  title: string;
  titleLocal: LocalizedText;
  description?: string | null;
  descriptionLocal?: LocalizedText;
  imageUrl?: string | null;
  pointsCost: number;
  quantity?: number | null;
  claimed: number;
  isActive: boolean;
};

export type UserPrize = {
  id: string;
  qrCode: string;
  isRedeemed: boolean;
  redeemedAt?: string | null;
  claimedAt: string;
  validUntil: string;
  prize: Pick<Prize, 'id' | 'title' | 'titleLocal' | 'imageUrl' | 'pointsCost'>;
};

export type PrizesResponse = { prizes: Prize[] };
export type PrizeDetailResponse = { prize: Prize | null };
export type MyPrizesResponse = { myPrizes: UserPrize[] };
