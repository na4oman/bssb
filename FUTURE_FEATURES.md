# Future Features - BSSB App

## Planned Features for Future Implementation

### 1. Season Statistics 📊
**Description:** Display Sunderland's comprehensive season statistics

**Features to Include:**
- Total goals scored
- Total goals conceded
- Clean sheets count
- Win/Draw/Loss record
- Home vs Away performance
- Average possession
- Shots on target
- Cards (yellow/red)
- Current league position trend

**API Endpoint:** 
- `GET /v4/teams/{teamId}` - Team information and statistics
- Available in free tier with delayed data

**UI Suggestions:**
- Create a new "Stats" tab or section in the app
- Use cards with icons for each statistic
- Show comparison with last season (if available)
- Visual charts/graphs for trends

---

### 2. Top Scorers 🥇
**Description:** Show Sunderland's top goal scorers for the current season

**Features to Include:**
- Player name and photo
- Goals scored
- Assists (if available)
- Minutes played
- Goals per game ratio
- Leaderboard format

**API Endpoint:**
- `GET /v4/teams/{teamId}/matches` - Parse goals from match data
- May need to aggregate data from multiple matches
- Free tier has limited player data

**UI Suggestions:**
- Leaderboard/ranking style display
- Player cards with stats
- Filter by competition (league, cup, etc.)
- Show top 5-10 scorers

**Note:** Player-specific data might be limited in free tier. May need to aggregate from match data.

---

### 3. Match Predictions 🎯
**Description:** Allow users to predict match scores and compete with friends

**Features to Include:**
- Predict score for upcoming matches
- Points system for accurate predictions:
  - Exact score: 3 points
  - Correct result (W/D/L): 1 point
  - Wrong: 0 points
- Leaderboard showing top predictors
- Compare predictions with friends
- Show community average prediction
- Lock predictions before match starts
- Reveal actual results after match

**Technical Implementation:**
- Store predictions in Firestore:
  ```
  /predictions/{userId}/{matchId}
  - homeScore: number
  - awayScore: number
  - timestamp: Date
  - points: number (calculated after match)
  ```
- Create leaderboard collection:
  ```
  /leaderboard/{userId}
  - userName: string
  - totalPoints: number
  - correctPredictions: number
  - totalPredictions: number
  ```

**UI Suggestions:**
- Prediction form on each upcoming match
- Visual indicator showing if prediction is locked
- Leaderboard tab/section
- Friend comparison view
- Statistics: accuracy rate, best predictions, etc.
- Badges/achievements for milestones

**Social Features:**
- Share predictions on social media
- Create private leagues with friends
- Weekly/monthly challenges
- Push notifications for prediction reminders

---

## Implementation Priority

1. **Season Statistics** (Easy) - Direct API call, simple UI
2. **Top Scorers** (Medium) - May need data aggregation
3. **Match Predictions** (Complex) - Requires backend logic, social features

---

## Notes

- All features should maintain the Sunderland red theme (#e21d38)
- Ensure mobile-first responsive design
- Consider offline functionality where possible
- Add loading states and error handling
- Test with free tier API limits (10 calls/minute)

---

## Additional Ideas to Consider

- **Player Profiles** - Detailed stats for individual players
- **Match Highlights** - Links to video highlights (if available)
- **Ticket Information** - Integration with ticket sales
- **Fan Polls** - Vote on Man of the Match, predictions, etc.
- **News Integration** - Aggregate Sunderland news from multiple sources
- **Match Day Experience** - Stadium info, parking, food, etc.
- **Historical Data** - Past seasons, legendary matches, records
- **Fantasy League** - Create fantasy team with Sunderland players

---

**Last Updated:** January 18, 2026
