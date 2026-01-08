import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Task } from "../types/types";

type TaskCardProps = {
  task: Task;
  onPress?: () => void;
  onToggleDone?: () => void;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onToggleDone }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={[styles.title, task.done && styles.doneText]}>
          {task.title}
        </Text>
        <TouchableOpacity style={styles.statusButton} onPress={onToggleDone}>
          <Text style={styles.statusText}>{task.done ? "✅" : "⬜"}</Text>
        </TouchableOpacity>
      </View>
      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    flexShrink: 1,
  },
  doneText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  description: {
    marginTop: 8,
    color: "#666",
  },
  statusButton: {
    padding: 4,
  },
  statusText: {
    fontSize: 20,
  },
});

export default TaskCard;
