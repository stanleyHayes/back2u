import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { ScrollView } from 'react-native';
import { List, Text } from 'react-native-paper';

const ITEMS = [
  { href: '/bookmarks', icon: 'bookmark', title: 'Bookmarks', subtitle: 'Saved items' },
  { href: '/notifications', icon: 'notifications', title: 'Notifications', subtitle: 'Alerts & updates' },
  { href: '/shop', icon: 'cart', title: 'QR Tag Shop', subtitle: 'Buy tag packs' },
  { href: '/found-near-you', icon: 'compass', title: 'Found Near You', subtitle: 'Recently found items' },
  { href: '/map', icon: 'map', title: 'Map', subtitle: 'Lost zones near you' },
  { href: '/leaderboard', icon: 'trophy', title: 'Top finders', subtitle: 'Leaderboard + badges' },
  { href: '/marketplace', icon: 'storefront', title: 'Marketplace', subtitle: 'Unclaimed item auctions' },
  { href: '/tags', icon: 'qr-code', title: 'QR tags', subtitle: 'Claim & manage tags' },
  { href: '/scan-tag', icon: 'scan', title: 'Scan a tag', subtitle: 'Notify the owner' },
  { href: '/vault', icon: 'lock-closed', title: 'Memory vault', subtitle: 'Receipts, serials, IMEIs' },
  { href: '/courier', icon: 'bicycle', title: 'Courier', subtitle: 'Request a delivery' },
  { href: '/zones', icon: 'compass', title: 'Zone alerts', subtitle: 'Subscribe to areas' },
  { href: '/safety', icon: 'shield-checkmark', title: 'Safety', subtitle: 'Block / report' },
  { href: '/settings', icon: 'settings', title: 'Settings', subtitle: 'Language, privacy, redeem' },
] as const;

export default function MoreScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 8 }}>More</Text>
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} asChild>
          <List.Item
            title={it.title}
            description={it.subtitle}
            left={(p) => <List.Icon {...p} icon={() => <Ionicons name={it.icon as never} size={24} color="#0F766E" />} />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
          />
        </Link>
      ))}
    </ScrollView>
  );
}
