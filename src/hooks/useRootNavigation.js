import { useNavigation } from '@react-navigation/native';

export function useRootNavigation() {
  const navigation = useNavigation();
  let root = navigation;
  while (root.getParent()) {
    root = root.getParent();
  }
  return root;
}
