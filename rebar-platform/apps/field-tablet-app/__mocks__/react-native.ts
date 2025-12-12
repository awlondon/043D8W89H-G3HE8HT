const React = require('react');

const View = ({ children, ...props }: any) => React.createElement('View', props, children);
const Text = ({ children, ...props }: any) => React.createElement('Text', props, children);
const TouchableOpacity = ({ children, onPress, ...props }: any) =>
  React.createElement('TouchableOpacity', { ...props, onPress }, children);
const ScrollView = ({ children, ...props }: any) => React.createElement('ScrollView', props, children);
const SafeAreaView = ({ children, ...props }: any) => React.createElement('SafeAreaView', props, children);
const Button = ({ title, onPress, ...props }: any) => React.createElement('Button', { ...props, title, onPress });
const StyleSheet = { create: (styles: any) => styles };

module.exports = {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Button,
  StyleSheet,
};
