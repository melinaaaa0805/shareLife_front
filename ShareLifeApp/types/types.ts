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
}

export interface GroupMember {
  id: string;
  firstName: string;
  email: string;
}
// types.ts

export type Task = {
  id: string;                // identifiant unique de la tâche
  title: string;             // titre de la tâche
  description?: string;      // description optionnelle
  completed: boolean;             // statut : réalisée ou non
  assignedUser?: User;       // id de l'utilisateur assigné (optionnel)
  groupId: string;           // id du groupe auquel appartient la tâche
  createdAt: string;         // date de création
  updatedAt?: string;        // date de dernière modification
};
export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  GroupsScreen: undefined;
  CreateGroupScreen: undefined;
  GroupDashboardScreen: { groupId: string; currentUserId: string };
  TasksScreen: { groupId: string; currentUserId: string };
  TaskDetailScreen: { taskId: string };
  StatsScreen: undefined;
   UnassignedTasks: { groupId: string };
  AddMember: { groupId: string };
  GroupMembers: { groupId: string };
  addTask: { day: string; };
};
