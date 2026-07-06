import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { View } from 'react-native';

export function IceCreamBowlIllustration({ size = 200 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Bowl */}
        <Path
          d="M50 100 Q50 140 100 145 Q150 140 150 100 L140 100 Q140 130 100 133 Q60 130 60 100 Z"
          fill="#7CC9A9"
        />

        {/* Ice cream scoops */}
        <Circle cx="80" cy="85" r="25" fill="#FFA07A" />
        <Circle cx="120" cy="85" r="25" fill="#FFE4B5" />
        <Circle cx="100" cy="60" r="25" fill="#FFB6C1" />

        {/* Decorative dots */}
        <Circle cx="80" cy="85" r="3" fill="#FF6B6B" />
        <Circle cx="120" cy="85" r="3" fill="#F5A962" />
        <Circle cx="100" cy="60" r="3" fill="#E63946" />

        {/* Wafer stick */}
        <Path
          d="M95 90 L90 110"
          stroke="#D2691E"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export function CustomizeIllustration({ size = 200 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Cone */}
        <Path
          d="M70 110 L100 180 L130 110 Z"
          fill="#F5DEB3"
        />
        <Path
          d="M75 115 L85 140 M95 115 L100 135 M115 115 L105 140 M85 140 L95 165 M105 140 L95 165"
          stroke="#D2B48C"
          strokeWidth="1.5"
        />

        {/* Ice cream scoops with toppings */}
        <Ellipse cx="100" cy="90" rx="35" ry="30" fill="#87CEEB" />
        <Ellipse cx="100" cy="70" rx="30" ry="25" fill="#FFE4C0" />

        {/* Toppings - sprinkles */}
        <Path d="M85 80 L88 85" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
        <Path d="M95 75 L92 80" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round" />
        <Path d="M105 78 L108 83" stroke="#FFE66D" strokeWidth="2" strokeLinecap="round" />
        <Path d="M110 85 L113 90" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
        <Path d="M90 90 L87 95" stroke="#A8E6CF" strokeWidth="2" strokeLinecap="round" />

        {/* Cherry on top */}
        <Circle cx="100" cy="55" r="6" fill="#E63946" />
        <Path
          d="M100 55 Q95 45 90 40"
          stroke="#2D6A4F"
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function DeliveryIllustration({ size = 200 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Delivery scooter body */}
        <Path
          d="M60 100 L90 100 L95 85 L130 85 L135 100 L160 100"
          stroke="#F59E0B"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Seat */}
        <Path
          d="M85 85 Q90 75 100 75 L105 85"
          fill="#F59E0B"
        />

        {/* Front wheel */}
        <Circle cx="70" cy="120" r="15" fill="none" stroke="#2D3748" strokeWidth="3" />
        <Circle cx="70" cy="120" r="3" fill="#2D3748" />

        {/* Back wheel */}
        <Circle cx="140" cy="120" r="15" fill="none" stroke="#2D3748" strokeWidth="3" />
        <Circle cx="140" cy="120" r="3" fill="#2D3748" />

        {/* Delivery box */}
        <Path
          d="M105 70 L135 70 L140 85 L135 100 L105 100 L100 85 Z"
          fill="#7CC9A9"
        />

        {/* Box details */}
        <Path
          d="M120 70 L120 100 M105 85 L135 85"
          stroke="#5AB592"
          strokeWidth="2"
        />

        {/* Ice cream icon on box */}
        <Circle cx="120" cy="78" r="4" fill="#FFE4E1" />

        {/* Speed lines */}
        <Path
          d="M40 90 L50 90 M35 100 L48 100 M38 110 L50 110"
          stroke="#CBD5E0"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
