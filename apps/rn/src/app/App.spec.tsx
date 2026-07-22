import { render } from '@testing-library/react-native';

import App from './App';

test('renders the native application shell', () => {
  const { getByTestId } = render(<App />);

  expect(getByTestId('app-title')).toHaveTextContent('SaaS Template');
});
