import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { format } from 'date-fns'

interface Comment {
  id: string
  userName: string
  text: string
  timestamp: number
}

export default function CommentItem({ comment }: { comment: Comment }) {
  return (
    <View key={comment.id} style={styles.commentItem}>
      <Text style={styles.commentUserName}>{comment.userName}</Text>
      <Text style={styles.commentText}>{comment.text}</Text>
      <Text style={styles.commentTimestamp}>
        {format(comment.timestamp, 'MMM dd, HH:mm')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  commentItem: {
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  commentTimestamp: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
})
