"""Generate the 3 mobile-app onboarding slide images, one set per language.

Each output is a clean device bezel (built procedurally by frame.phone_frame,
not a static asset — avoids any mismatch between the bezel's rounded screen
cutout and the composited screenshot) wrapping a mocked app screenshot that
matches the copy of Onboarding.slide1/2/3 in each app locale's translations
file:
  1. "Order ice cream in a tap"        -> flavours/menu list
  2. "Earn points with every order"    -> rewards/points screen
  3. "Redeem prizes & find spots"      -> map with spots

Run from store-assets/_gen/:
    python3 onboarding.py
Writes mobile/assets/images/onboard/slide{1,2,3}_{en,pl,ua}.png — the app
picks the file matching the active i18n language, falling back to en.
"""
from __future__ import annotations

import os

from PIL import Image

import screens
from frame import phone_frame

MOBILE_ONBOARD = os.path.join(
    os.path.dirname(__file__), "..", "..", "mobile", "assets", "images", "onboard"
)

LOCALES = ["en", "pl", "ua"]

# Render each mock at a taller-than-square logical canvas (rather than the
# full PHONE_H then cropping) so bottom-anchored elements — the tab bar, the
# map's floating spot card — reflow to the new bottom instead of being cut
# off mid-element.
SLIDE_H = 2150


def main():
    for loc in LOCALES:
        slides = {
            f"slide1_{loc}.png": screens.client_menu(loc, h=SLIDE_H),
            f"slide2_{loc}.png": screens.client_rewards(loc, h=SLIDE_H),
            f"slide3_{loc}.png": screens.client_map(loc, h=SLIDE_H),
        }
        for name, screen_img in slides.items():
            framed = phone_frame(screen_img, radius_ratio=0.09, bezel_ratio=0.018)
            path = os.path.join(MOBILE_ONBOARD, name)
            framed.save(path, "PNG", optimize=True)
            print("wrote", name, framed.size)


if __name__ == "__main__":
    main()
