export interface MuscleDataItem {
    key: string;
    name: string;
    intensity: number;
    strength: number;
    size: number;
}

const MusclesData: MuscleDataItem[] = [
    { key: "head", name: "Đầu", intensity: 1, strength: 2, size: 1 },
    { key: "traps", name: "Traps", intensity: 2, strength: 3, size: 2 },
    { key: "chest", name: "Ngực", intensity: 3, strength: 1, size: 3 },
    { key: "frontShoulder", name: "Vai trước", intensity: 2, strength: 2, size: 2 },
    { key: "abs", name: "Bụng", intensity: 1, strength: 1, size: 1 },
    { key: "biceps", name: "Bắp tay", intensity: 2, strength: 3, size: 2 },
    { key: "forearms", name: "Cẳng tay", intensity: 1, strength: 2, size: 1 },
    { key: "quads", name: "Đùi trước", intensity: 3, strength: 3, size: 3 },
    { key: "calves", name: "Bắp chân", intensity: 2, strength: 2, size: 2 },
    { key: "rearShoulder", name: "Vai sau", intensity: 2, strength: 3, size: 2 },
    { key: "lowerBack", name: "Lưng dưới", intensity: 3, strength: 3, size: 3 },
    { key: "back", name: "Lưng", intensity: 3, strength: 2, size: 3 },
    { key: "triceps", name: "Tay sau", intensity: 2, strength: 3, size: 2 },
    { key: "hamstrings", name: "Đùi sau", intensity: 3, strength: 3, size: 3 },
    { key: "glutes", name: "Mông", intensity: 3, strength: 2, size: 3 },
];

export default MusclesData;
