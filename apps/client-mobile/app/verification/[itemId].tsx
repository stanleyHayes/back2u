import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, ProgressBar, Text, TextInput } from 'react-native-paper';

import { api } from '../../src/lib/api';

export default function VerificationScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { data: questions } = useQuery({ queryKey: ['verif-questions'], queryFn: () => api.getVerificationQuestions() });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [proofText, setProofText] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      api.submitVerification({
        itemId: itemId!,
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
        proofs: [{ kind: 'other', text: proofText || 'no extra proof' }],
      }),
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Prove ownership</Text>
      {questions?.map((q) => (
        <View key={q.id}>
          <Text>{q.prompt}</Text>
          <TextInput value={answers[q.id] ?? ''} onChangeText={(v) => setAnswers({ ...answers, [q.id]: v })} multiline />
        </View>
      ))}
      <TextInput label="Extra proof" multiline value={proofText} onChangeText={setProofText} />
      <Button mode="contained" onPress={() => submit.mutate()} loading={submit.isPending}>Submit</Button>
      {submit.isSuccess && (
        <View>
          <Text>Status: {submit.data.status}</Text>
          <ProgressBar progress={submit.data.aiConsistencyScore} />
          <HelperText type="info">AI consistency: {Math.round(submit.data.aiConsistencyScore * 100)}%</HelperText>
        </View>
      )}
    </ScrollView>
  );
}
