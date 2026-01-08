export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Group {
  id: string;
  name: string;
  createdAt: string;
  owner: User;
  members?: GroupMember[];
  membersCount?: number;
  overdueTasks?: number;
}

export interface GroupMember {
  id: string;
  firstName: string;
  email: string;
}
// types.ts

export type Task = {
  id: string; // UUID
  title: string; // défaut "Sans titre"
  description?: string | null;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY';
  weekNumber: number;
  year: number;
  dayOfWeek: number; // 0 = lundi → 6 = dimanche
  weight: number;
  done: boolean; // remplace completed
  duration?: number | null;
  date?: string | null; // format YYYY-MM-DD
  group?: Group;
  createdBy?: User;
  assignedUser?: User;
  createdById: string; // UUID de l'utilisateur créateur
  createdAt: string;
  updatedAt?: string | null;
};
export type RootStackParamList2 = {
 
  Login: undefined;
  Register: undefined;
  Groups: undefined;
  CreateGroup: undefined;
  GroupDashboard: { groupId: string; currentUserId: string };
  UnassignedTasks: { groupId: string };
  AddMember: { groupId: string };
  GroupMembers: { groupId: string };
  TasksScreen: { groupId: string; currentUserId: string };
  AddTask: { day?: string };
  DayTasks: undefined;
};
export type RootStackParamList = {
   Home: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  Groups: undefined;
  CreateGroup: undefined;
    GroupDetail: { groupId: string; group?: Group };
  GroupDashboard: { groupId: string; currentUserId: string };
  TasksScreen: { groupId: string; currentUserId: string };
  TaskDetailScreen: { taskId: string };
  StatsScreen: undefined;
   UnassignedTasks: { groupId: string };
  AddMember: { groupId: string };
  GroupMembers: { groupId: string };
  AddTask: undefined;
    Settings: undefined;
  DayTasks: { date: string; dayIndex: number }; 
  ImportTask: {day: string};
};
