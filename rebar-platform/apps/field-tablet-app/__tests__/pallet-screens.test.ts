import React from 'react';
import renderer, { act } from 'react-test-renderer';
import App from '../src/App';

jest.mock('react-native');

describe('Field tablet pallet screens', () => {
  it('renders a pallet list after generating plans', () => {
    const component = renderer.create(<App />);
    const root = component.root;

    const projectCard = root.findByProps({ accessibilityLabel: 'Open project details' });
    act(() => projectCard.props.onPress());

    const palletButton = root.find((node) => node.props?.title === 'Pallet plans');
    act(() => palletButton.props.onPress());

    const generateButton = root.find((node) => node.props?.title === 'Generate pallet plan');
    act(() => generateButton.props.onPress());

    const textNodes = root.findAll((node) => node.type === 'Text');
    const textContent = textNodes.flatMap((node) =>
      Array.isArray(node.props.children) ? node.props.children : [node.props.children],
    );
    const hasPallet = textContent.some((value) => typeof value === 'string' && value.includes('Pallet 1'));
    expect(hasPallet).toBe(true);
  });

  it('navigates into pallet detail with layers', () => {
    const component = renderer.create(<App />);
    const root = component.root;

    const projectCard = root.findByProps({ accessibilityLabel: 'Open project details' });
    act(() => projectCard.props.onPress());
    const palletButton = root.find((node) => node.props?.title === 'Pallet plans');
    act(() => palletButton.props.onPress());
    const generateButton = root.find((node) => node.props?.title === 'Generate pallet plan');
    act(() => generateButton.props.onPress());

    const palletCards = root.findAllByType('TouchableOpacity');
    expect(palletCards.length).toBeGreaterThan(0);
    act(() => palletCards[0].props.onPress());

    const detailText = root
      .findAll((node) => node.type === 'Text')
      .flatMap((node) => (Array.isArray(node.props.children) ? node.props.children : [node.props.children]));
    const hasLayerCopy = detailText.some((value) => typeof value === 'string' && value.includes('Layer 1'));
    expect(hasLayerCopy).toBe(true);
  });
});
