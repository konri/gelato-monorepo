import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
}

export const TabView = ({ tabs }: TabViewProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '');

  const activeTabContent = tabs.find(tab => tab.key === activeTab)?.content;

  return (
    <View className="flex-1">
      {/* Tab Headers */}
      <View className="bg-gray-100 rounded-2xl p-1 mx-4 mb-4">
        <View className="flex-row">
          {tabs.map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === tab.key ? 'bg-white' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center body-small ${
                  activeTab === tab.key ? 'text-black font-semibold' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTabContent}
      </ScrollView>
    </View>
  );
};
