import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Avatar, Button, Card, Chip, Text } from 'react-native-paper';

import { signOut } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth.store';

export default function ProfileScreen() {
  const { user } = useAuth();
  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text variant="headlineSmall">You're signed out</Text>
        <Text style={{ marginVertical: 12 }}>Sign in to post items and see your matches.</Text>
        <Link href="/login" asChild>
          <Button mode="contained">Sign in</Button>
        </Link>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Card.Title
          title={user.name}
          subtitle={user.email}
          left={(props) => <Avatar.Text {...props} label={(user.name[0] ?? '?').toUpperCase()} />}
        />
        <Card.Content>
          <Text>Reputation: {user.reputationScore}</Text>
          <Text>Points: {user.pointsBalance}</Text>
          <Text>Successful returns: {user.successfulReturns ?? 0}</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {(user.badges ?? []).map((b) => <Chip key={b}>{b.replace('_', ' ')}</Chip>)}
            {!user.emailVerified && <Chip icon="email-alert">email unverified</Chip>}
            {!user.phoneVerified && <Chip icon="phone-alert">phone unverified</Chip>}
          </View>
        </Card.Content>
        <Card.Actions>
          <Link href="/settings" asChild><Button>Settings</Button></Link>
          <Link href="/trusted-finder-apply" asChild>
            <Button icon="shield-check">Trusted Finder</Button>
          </Link>
          <Link href={`/reviews?userId=${user.id}`} asChild>
            <Button icon="star">Reviews</Button>
          </Link>
          <Button onPress={() => void signOut()}>Sign out</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );
}
