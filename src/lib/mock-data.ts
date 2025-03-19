export type Thread = {
  id: string;
  title: string;
  initialMessage: string;
  channelId: string;
  channelName: string;
  type: "channel" | "dm";
  participantsCount: number;
  lastActivityAt: Date;
  createdAt: Date;
};

export const mockThreads: Thread[] = [
  {
    id: "1",
    title: "Project Discussion",
    initialMessage: "Let's discuss the new features for the upcoming release",
    channelId: "ch1",
    channelName: "general",
    type: "channel",
    participantsCount: 5,
    lastActivityAt: new Date("2024-03-20T10:00:00"),
    createdAt: new Date("2024-03-20T09:00:00"),
  },
  {
    id: "2",
    title: "Bug Report",
    initialMessage: "Found a critical issue in production",
    channelId: "ch2",
    channelName: "bugs",
    type: "channel",
    participantsCount: 3,
    lastActivityAt: new Date("2024-03-19T15:30:00"),
    createdAt: new Date("2024-03-19T15:00:00"),
  },
  {
    id: "3",
    title: "Design Review",
    initialMessage: "Can you check these mockups?",
    channelId: "dm1",
    channelName: "Alice Johnson",
    type: "dm",
    participantsCount: 2,
    lastActivityAt: new Date("2024-03-18T14:20:00"),
    createdAt: new Date("2024-03-18T14:00:00"),
  },
  {
    id: "4",
    title: "Design Review",
    initialMessage: "Can you check these mockups?",
    channelId: "dm1",
    channelName: "Alice Johnson",
    type: "dm",
    participantsCount: 2,
    lastActivityAt: new Date("2024-03-18T14:20:00"),
    createdAt: new Date("2024-03-18T14:00:00"),
  },
  {
    id: "5",
    title: "Design Review",
    initialMessage: "Can you check these mockups?",
    channelId: "dm1",
    channelName: "Alice Johnson",
    type: "dm",
    participantsCount: 2,
    lastActivityAt: new Date("2024-03-18T14:20:00"),
    createdAt: new Date("2024-03-18T14:00:00"),
  },
];
