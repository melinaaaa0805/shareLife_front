export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export type GroupMode = 'FREE' | 'FUNNY' | 'SMART';
export type MemberProfile = 'ADULT' | 'CHILD';
export type TaskType = 'FAMILY' | 'ADULT' | 'ADULT_CHILD';

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  owner: User;
  members?: GroupMember[];
  membersCount?: number;
  overdueTasks?: number;
  mode?: GroupMode;
  weeklyAdmin?: User | null;
}

export interface GroupMember {
  id: string;
  firstName: string;
  email: string;
  profile?: MemberProfile;
}

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
  weekNumber: number;
  year: number;
  dayOfWeek: number;
  weight: number;
  done: boolean;
  duration?: number | null;
  date?: string | null;
  taskType?: TaskType;
  group?: Group;
  createdBy?: User;
  assignedUser?: User;
  createdById: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Groups: undefined;
  Calendar: undefined;
  MealPlanner: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string; group?: Group };
  GroupDashboard: { groupId: string; currentUserId: string };
  TasksScreen: { groupId: string; currentUserId: string };
  TaskDetailScreen: { taskId: string };
  StatsScreen: undefined;
  UnassignedTasks: { groupId: string };
  AddMember: { groupId: string };
  GroupMembers: { groupId: string };
  AddTask: { task?: Task | undefined };
  Settings: undefined;
  DayTasks: { date: string; dayIndex: number };
  ImportTask: { day: string };
  WeekTemplate: undefined;
  SmartAssign: { groupId: string };
  SpinWheel: { groupId: string; members: GroupMember[] };
  ForgotPassword: undefined;
};
