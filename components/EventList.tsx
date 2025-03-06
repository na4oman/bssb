import React from 'react';
import { FlatList, Text } from 'react-native';

const EventList = ({ events }: { events: any[] }) => {
  return (
    <FlatList
      data={events}
      renderItem={({ item }) => <Text>{item.title}</Text>}
      keyExtractor={item => item.id}
    />
  );
};

export default EventList;