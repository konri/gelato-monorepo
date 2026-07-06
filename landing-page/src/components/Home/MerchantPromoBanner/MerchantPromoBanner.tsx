import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import type { MerchantPromoBannerProps } from '@/components/Home/MerchantPromoBanner/types';

const MerchantPromoBanner = ({
  title,
  cta,
  ariaLabel,
  logoAlt,
  registerPhoneAlt,
  loyaltyPhoneAlt,
}: MerchantPromoBannerProps) => {
  return (
    <div className="mx-auto mt-16 w-full max-w-[1197px] px-4 sm:mt-20 md:mt-24 lg:mt-28 sm:px-0">
      <section
        className="relative w-full overflow-hidden rounded-3xl bg-[radial-gradient(74.14%_175.06%_at_28.11%_84.08%,#1B4580_0%,#5E94E1_100%)]"
        aria-label={ariaLabel}
      >
        <div className="flex flex-col gap-5 p-6 pb-8 md:hidden">
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image
                src={IMAGES.home.thirdSection.merchantLogo}
                alt={logoAlt}
                width={73}
                height={68}
                className="h-12 w-12 shrink-0 object-contain"
              />
              <h3 className="text-[26px] font-black leading-[1.19] tracking-[0.2px] text-white">{title}</h3>
            </div>
            <p className="inline-flex w-fit max-w-full items-center justify-center rounded-[26px] border border-white bg-[linear-gradient(90deg,rgba(255,255,255,0.13)_0%,rgba(153,153,153,0.13)_100%)] px-5 py-2 text-[17px] font-semibold leading-[1.19] tracking-[0.2px] text-white">
              {cta}
            </p>
          </header>

          <div className="relative mx-auto mt-2 w-full max-w-[min(100%,340px)] min-h-[220px] sm:min-h-[250px]">
            <Image
              src={IMAGES.home.thirdSection.merchantRegisterPhone}
              alt={registerPhoneAlt}
              width={704}
              height={966}
              className="relative z-10 ml-[2%] mt-10 h-auto w-[46%] object-contain sm:mt-12"
              sizes="46vw"
              priority
            />
            <Image
              src={IMAGES.home.thirdSection.merchantLoyaltyPhone}
              alt={loyaltyPhoneAlt}
              width={559}
              height={1024}
              className="absolute right-0 top-0 z-20 h-auto w-[50%] object-contain"
              sizes="50vw"
              priority
            />
          </div>
        </div>

        <div className="relative mx-auto hidden aspect-[1197/779] w-full min-h-[480px] md:block lg:min-h-[520px]">
          <header className="absolute left-[6%] top-[8%] z-30 flex max-w-[min(100%,420px)] flex-col gap-5 lg:left-[7%] lg:top-[11%]">
            <div className="flex items-center gap-4">
              <Image
                src={IMAGES.home.thirdSection.merchantLogo}
                alt={logoAlt}
                width={73}
                height={68}
                className="h-[60px] w-[60px] shrink-0 object-contain lg:h-[68px] lg:w-[68px]"
              />
              <h3 className="text-[32px] font-black leading-[1.19] tracking-[0.2px] text-white lg:text-[38px]">
                {title}
              </h3>
            </div>
            <p className="inline-flex w-fit max-w-full items-center justify-center rounded-[26px] border border-white bg-[linear-gradient(90deg,rgba(255,255,255,0.13)_0%,rgba(153,153,153,0.13)_100%)] px-6 py-2.5 text-xl font-semibold leading-[1.19] tracking-[0.2px] text-white lg:min-h-[43px]">
              {cta}
            </p>
          </header>

          <Image
            src={IMAGES.home.thirdSection.merchantRegisterPhone}
            alt={registerPhoneAlt}
            width={704}
            height={966}
            className="pointer-events-none absolute left-[12%] top-[36%] z-10 h-auto w-[38%] max-w-[300px] lg:left-[17.1%] lg:top-[38%] lg:w-[29.4%] lg:max-w-[352px]"
            sizes="(max-width: 1279px) 38vw, 352px"
            priority
          />
          <Image
            src={IMAGES.home.thirdSection.merchantLoyaltyPhone}
            alt={loyaltyPhoneAlt}
            width={559}
            height={1024}
            className="pointer-events-none absolute left-[44%] top-[15%] z-20 h-auto w-[38%] max-w-[300px] lg:left-[53.5%] lg:top-[17.3%] lg:w-[29.4%] lg:max-w-[352px]"
            sizes="(max-width: 1279px) 38vw, 352px"
            priority
          />
        </div>
      </section>
    </div>
  );
};

export default MerchantPromoBanner;
