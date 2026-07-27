
This file specifies exactly how the radio time table will work, look like and be implemented in code.
This is focused on the implementation of the management UI inside the radio dashboard.

## What is the time table?

In a real professional radio, usually the radio has predefined times for various programs and audio files. The time table or the schedule as it is called in Radiant
is the direct implementation of that concept. Instead of having a real human watching the clock 24/7 and playing each audio file manually, the radio owner *schedules* a *block* which Radiant will eventually broadcast.

Each block represents some amount of content which will be broadcasted by Radiant. Each block can be a weekly block of a one-off block. Currently only single
audio file blocks are supported, but playlist support and live blocks are planned for implementation.


## Design


The timetable Y axis represents wall clock hours through out the day, the X axis is the days. The Y axis is continuous so it doesn't have a grid blocks need to necessarily snap to.

### Time Ticks

For guidance, the timetable has "time ticks" which are lines that act like the lines of a ruler, and they are automatically generated given the vertical space they have.

how the time ticks look like:
```
---------------------------------------------------
| 00:00 ------------------------------------------|
| 02:00 ------------------------------------------|
| 04:00 ------------------------------------------|
| 06:00 ------------------------------------------|
| 08:00 ------------------------------------------|
| 10:00 ------------------------------------------|
| 12:00 ------------------------------------------|
| 14:00 ------------------------------------------|
| 16:00 ------------------------------------------|
| 18:00 ------------------------------------------|
| 20:00 ------------------------------------------|
| 22:00 ------------------------------------------|
---------------------------------------------------
```

In this case it is going 2 by 2 hours, but if we squeeze it, it automatically makes it jump 4 by 4 hours. It decides that by how crammed the lines are, it keeps dividing the amount of ticks by half until it is not crammed anymore.


### Day tracks

The week usually haves 7 days so the time table will have 7 continuous tracks each having a header telling the day of the week and the date in DD/MM format.

Inside each track, the blocks coming the backend will be rendered in those continuous vertical tracks with absolute positioning.

### DST skips

In some timezones, DST is a thing and the time table needs to handle it flawlessly. This design solves it in an elegent way:

#### Spring

how the time ticks would look like:
```
|-----------------------------------------------------------------------------|
|      | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday |
|-----------------------------------------------------------------------------|
| 00:00 --------|---------|-----------|----------|--------|----------|--------|
| 01:00 \\\\\\\\|---------|-----------|----------|--------|----------|--------|
| 02:00 --------|---------|-----------|----------|--------|----------|--------|
| 03:00 --------|---------|-----------|----------|--------|----------|--------|
| 04:00 --------|---------|-----------|----------|--------|----------|--------|
| 05:00 --------|---------|-----------|----------|--------|----------|--------|
| 06:00 --------|---------|-----------|----------|--------|----------|--------|
| 07:00 --------|---------|-----------|----------|--------|----------|--------|
| 08:00 --------|---------|-----------|----------|--------|----------|--------|
| 09:00 --------|---------|-----------|----------|--------|----------|--------|
| 10:00 --------|---------|-----------|----------|--------|----------|--------|
| 11:00 --------|---------|-----------|----------|--------|----------|--------|
| 12:00 --------|---------|-----------|----------|--------|----------|--------|
| 13:00 --------|---------|-----------|----------|--------|----------|--------|
| 14:00 --------|---------|-----------|----------|--------|----------|--------|
| 15:00 --------|---------|-----------|----------|--------|----------|--------|
| 16:00 --------|---------|-----------|----------|--------|----------|--------|
| 17:00 --------|---------|-----------|----------|--------|----------|--------|
| 18:00 --------|---------|-----------|----------|--------|----------|--------|
| 19:00 --------|---------|-----------|----------|--------|----------|--------|
| 20:00 --------|---------|-----------|----------|--------|----------|--------|
| 21:00 --------|---------|-----------|----------|--------|----------|--------|
| 22:00 --------|---------|-----------|----------|--------|----------|--------|
| 23:00 --------|---------|-----------|----------|--------|----------|--------|
|-------------------------|-----------|----------|--------|----------|--------|
```

the `\\\\\\\\` part means it's grayed out, it tells the user that that time range literally doesn't exist, it skips straight from 1 AM to 3 AM.
#### Autumn

how the time ticks would look like:
```
|-------------------------------------------------------------------------------|
|        | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday |
|-------------------------------------------------------------------------------|
| 00:00   --------|---------|-----------|----------|--------|----------|--------|
| 01:00   --------|---------|-----------|----------|--------|----------|--------|
| 01:00 ? \\\\\\\\|\\\\\\\\\|-----------|\\\\\\\\\\|\\\\\\\\|\\\\\\\\\\|\\\\\\\\|
| 02:00   --------|---------|-----------|----------|--------|----------|--------|
| 03:00   --------|---------|-----------|----------|--------|----------|--------|
| 04:00   --------|---------|-----------|----------|--------|----------|--------|
| 05:00   --------|---------|-----------|----------|--------|----------|--------|
| 06:00   --------|---------|-----------|----------|--------|----------|--------|
| 07:00   --------|---------|-----------|----------|--------|----------|--------|
| 08:00   --------|---------|-----------|----------|--------|----------|--------|
| 09:00   --------|---------|-----------|----------|--------|----------|--------|
| 10:00   --------|---------|-----------|----------|--------|----------|--------|
| 11:00   --------|---------|-----------|----------|--------|----------|--------|
| 12:00   --------|---------|-----------|----------|--------|----------|--------|
| 13:00   --------|---------|-----------|----------|--------|----------|--------|
| 14:00   --------|---------|-----------|----------|--------|----------|--------|
| 15:00   --------|---------|-----------|----------|--------|----------|--------|
| 16:00   --------|---------|-----------|----------|--------|----------|--------|
| 17:00   --------|---------|-----------|----------|--------|----------|--------|
| 18:00   --------|---------|-----------|----------|--------|----------|--------|
| 19:00   --------|---------|-----------|----------|--------|----------|--------|
| 20:00   --------|---------|-----------|----------|--------|----------|--------|
| 21:00   --------|---------|-----------|----------|--------|----------|--------|
| 22:00   --------|---------|-----------|----------|--------|----------|--------|
| 23:00   --------|---------|-----------|----------|--------|----------|--------|
|-----------------|---------|-----------|----------|--------|----------|--------|
```

In this case, we have a DST transition on wednesday where we leave DST, adding an extra dupicated hour the other days don't have.

The `?` icon next to the second extra time shows a tooltip telling the user about this behavior if he gets confused or thinks this is a bug although it is intended behavior.

### Blocks

The blocks have a similar design to cards but they are color coded depending on the type of block.
Editing blocks features will not be implemented at this stage.

Blocks will be rendered over the tracks on top of the time ticks and their position and size will match their start and end times exactly to scale to the time ticks
we have defined.

## Implementation

### Current stage

Currently we already have the time ticks implemented. The Day Tracks and blocks (including fetching the blocks from the backend using RadiantClient through effect-atom) is still missing.

### Code structure


Create a `DayTracks` component which takes in all the blocks, it will then layout all the day tracks across the time table, each day track will also be its own
`DayTrack` component receiving only the blocks to render for that day, the `DayTrack` component will then render the header, the separator lines between the tracks
and render each block, styling each block based on its type. It should also be aware of DST skips and automatically gray out regions of time ranges that don't exist as specified in `DST skips` section in this document.
