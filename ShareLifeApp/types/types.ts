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

/** Tâche avec son assignation (utilisé dans DayTasksScreen) */
export type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  duration?: number | null;
  weight?: number;
  taskAssignment?: {
    user?: { id: string; firstName?: string };
    status?: string;
  } | null;
};

/** Tâche non assignée (utilisé dans SmartAssignScreen et UnassignedScreen) */
export type UnassignedTask = {
  id: string;
  title: string;
  description?: string | null;
  weight: number;
  duration?: number | null;
  dayOfWeek: number;
  date?: string | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
};

/** Tâche template de semaine (utilisé dans WeekTemplateScreen) */
export type TemplateTask = {
  id: string;
  title: string;
  description?: string | null;
  frequency: "ONCE" | "DAILY" | "WEEKLY";
  dayOfWeek: number;
  weight: number;
  duration?: number | null;
};

/** Liste de courses */
export interface ShoppingItem {
  name: string;
  quantity: string;
  checked?: boolean;
}

export interface ShoppingList {
  id: string;
  weekNumber: number;
  year: number;
  items: ShoppingItem[];
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'FOOD'
  | 'TRANSPORT'
  | 'HOUSING'
  | 'UTILITIES'
  | 'LEISURE'
  | 'HEALTH'
  | 'OTHER';

export type SplitMode = 'EQUAL' | 'CUSTOM';

export interface ExpenseParticipant {
  userId: string;
  firstName: string;
  email: string;
  share: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitMode: SplitMode;
  date: string;
  createdAt: string;
  paidBy: { id: string; firstName: string; email: string } | null;
  participants: ExpenseParticipant[];
}

export interface Reimbursement {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
  fromUser: { id: string; firstName: string; email: string } | null;
  toUser: { id: string; firstName: string; email: string } | null;
}

export interface MemberBalance {
  userId: string;
  firstName: string;
  email: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface DebtEdge {
  fromUserId: string;
  fromFirstName: string;
  toUserId: string;
  toFirstName: string;
  amount: number;
}

export interface BalanceResponse {
  balances: MemberBalance[];
  simplifiedDebts: DebtEdge[];
}

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
