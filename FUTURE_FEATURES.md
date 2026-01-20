# Future Features - BSSB App

## Planned Features for Future Implementation

### 1. Season Statistics 📊 ✅ **COMPLETED**
**Description:** Display Sunderland's comprehensive season statistics

**Current Implementation:**
- ✅ Added "Stats" tab to fixtures screen
- ✅ Team basic information (name, founded, venue, crest)
- ✅ Current competitions display
- ✅ Clean UI with Sunderland red theme
- ✅ **NEW: Complete match statistics from fixture data**

**Features Implemented:**
- ✅ Team basic info and current competitions
- ✅ **Total goals scored** (calculated from matches)
- ✅ **Total goals conceded** (calculated from matches)
- ✅ **Clean sheets count** (calculated from matches)
- ✅ **Win/Draw/Loss record** (calculated from matches)
- ✅ **Home vs Away performance** (separate records)
- ✅ **Goal difference** (calculated metric)
- ✅ **Total matches played** (season progress)
- 🔄 Average possession (not available in free tier)
- 🔄 Shots on target (not available in free tier)
- 🔄 Cards (yellow/red) (not available in free tier)
- 🔄 Current league position trend (requires league table API)

**Technical Implementation:**
- **Data Source**: Aggregated from past fixtures data (real match results)
- **Real-time**: Updates automatically when new matches are completed
- **Accurate**: Based on actual match scores, not estimates

**UI Features:**
- ✅ Added as third tab in fixtures screen ("Upcoming", "Past", "Stats")
- ✅ Team header with crest and basic info
- ✅ Competitions section with emblems
- ✅ **Season Record**: Matches, Wins, Draws, Losses with color coding
- ✅ **Goals & Defense**: Goals scored/conceded, clean sheets, goal difference
- ✅ **Home vs Away**: Separate performance records
- ✅ Loading states and error handling
- ✅ Consistent Sunderland red theme (#e21d38)

**Status**: Phase 1 & 2 Complete - Comprehensive season statistics now available!

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

1. **Season Statistics** ✅ **COMPLETED** - Full season stats with match data aggregation
2. **Top Scorers** (Medium) - May need data aggregation from match events
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

**Last Updated:** January 20, 2026

## Recent Updates

### January 20, 2026
- ✅ **Season Statistics - COMPLETED**
  - Added "Stats" tab to fixtures screen
  - Implemented team basic information display
  - Added current competitions section
  - **NEW: Complete match statistics aggregation**
    - Win/Draw/Loss records with color coding
    - Goals scored/conceded and clean sheets
    - Goal difference calculation
    - Home vs Away performance breakdown
    - Real-time updates from match results
  - Clean UI with loading states and error handling
  - **Ready for next feature: Top Scorers**
