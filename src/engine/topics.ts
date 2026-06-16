// 6 大主题剧本库
// 适合 4 岁左右的中文短句，3-6 个节点一轮，
// 在 3 轮后必触发游戏/故事/换话题的邀请

export type ReplyOption = {
  label: string;
  icon?: string;
  value: string; // 状态机的输入
};

export type TopicNode = {
  id: string;
  text: string; // 机器人说
  options?: ReplyOption[]; // 2-3 个候选回复
  /** 给定一个 value，返回下一节点 id */
  next?: (choice: string) => string;
  /** 该主题走完最后一节点后跳到 */
  goto?: "game" | "story" | "switch";
};

export type Topic = {
  id: string;
  name: string;
  emoji: string;
  /** 背景主题色（CSS 变量可读） */
  tint: string;
  root: string; // 入口节点 id
  nodes: Record<string, TopicNode>;
};

const opt = (...arr: ReplyOption[]): ReplyOption[] => arr;

/** 动物主题 */
const animals: Topic = {
  id: "animals",
  name: "小动物",
  emoji: "🐰",
  tint: "forest",
  root: "a1",
  nodes: {
    a1: {
      id: "a1",
      text: "你最喜欢什么小动物呀？告诉小星吧！",
      options: opt(
        { label: "小兔子", icon: "🐰", value: "rabbit" },
        { label: "小狗狗", icon: "🐶", value: "dog" },
        { label: "小猫咪", icon: "🐱", value: "cat" },
      ),
      next: (c) => "a2_" + c,
    },
    a2_rabbit: {
      id: "a2_rabbit",
      text: "哇～小兔子的耳朵长长的，跳得可高啦！你摸过小兔子吗？",
      options: opt(
        { label: "摸过！", icon: "✋", value: "yes" },
        { label: "还没呀", icon: "🤔", value: "no" },
      ),
      next: () => "a3",
    },
    a2_dog: {
      id: "a2_dog",
      text: "汪汪汪～小狗会摇尾巴，最喜欢追小球啦！",
      options: opt(
        { label: "我喜欢", icon: "🥰", value: "yes" },
        { label: "还会叫", icon: "🗣️", value: "bark" },
      ),
      next: () => "a3",
    },
    a2_cat: {
      id: "a2_cat",
      text: "喵～小猫咪会爬树，眼睛亮晶晶的！",
      options: opt(
        { label: "好可爱", icon: "🥰", value: "yes" },
        { label: "我养过", icon: "🏠", value: "home" },
      ),
      next: () => "a3",
    },
    a3: {
      id: "a3",
      text: "所有小动物都是我们的好朋友，要爱护它们哦！",
      options: opt(
        { label: "玩个游戏", icon: "🎮", value: "game" },
        { label: "听故事", icon: "📖", value: "story" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => {
        if (c === "game") return "__game__";
        if (c === "story") return "__story__";
        return "__switch__";
      },
    },
  },
};

/** 颜色主题 */
const colors: Topic = {
  id: "colors",
  name: "颜色",
  emoji: "🎨",
  tint: "strawberry",
  root: "c1",
  nodes: {
    c1: {
      id: "c1",
      text: "今天你最喜欢什么颜色呀？",
      options: opt(
        { label: "红色", icon: "🟥", value: "red" },
        { label: "黄色", icon: "🟨", value: "yellow" },
        { label: "蓝色", icon: "🟦", value: "blue" },
      ),
      next: (c) => "c2_" + c,
    },
    c2_red: { id: "c2_red", text: "红色像太阳、像苹果，暖暖的好舒服～", options: opt({ label: "像苹果", icon: "🍎", value: "ok" }, { label: "像爱心", icon: "❤️", value: "ok" }), next: () => "c3" },
    c2_yellow: { id: "c2_yellow", text: "黄色像香蕉、像月亮，香香甜甜～", options: opt({ label: "像香蕉", icon: "🍌", value: "ok" }, { label: "像小鸡", icon: "🐥", value: "ok" }), next: () => "c3" },
    c2_blue: { id: "c2_blue", text: "蓝色像大海、像天空，凉凉的好舒服～", options: opt({ label: "像大海", icon: "🌊", value: "ok" }, { label: "像蓝莓", icon: "🫐", value: "ok" }), next: () => "c3" },
    c3: {
      id: "c3",
      text: "我们一起玩个颜色游戏吧？小星想看看你的眼力！",
      options: opt(
        { label: "好呀！", icon: "🎮", value: "game" },
        { label: "听故事", icon: "📖", value: "story" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => (c === "game" ? "__game__" : c === "story" ? "__story__" : "__switch__"),
    },
  },
};

/** 食物主题 */
const food: Topic = {
  id: "food",
  name: "好吃的",
  emoji: "🍎",
  tint: "tangerine",
  root: "f1",
  nodes: {
    f1: {
      id: "f1",
      text: "今天你吃了什么好吃哒呀？",
      options: opt(
        { label: "水果", icon: "🍇", value: "fruit" },
        { label: "米饭", icon: "🍚", value: "rice" },
        { label: "面条", icon: "🍜", value: "noodle" },
      ),
      next: (c) => "f2_" + c,
    },
    f2_fruit: { id: "f2_fruit", text: "水果甜甜的，维生素让你变得更强壮！", options: opt({ label: "好吃", icon: "😋", value: "ok" }, { label: "还要吃", icon: "🍓", value: "ok" }), next: () => "f3" },
    f2_rice: { id: "f2_rice", text: "米饭香香的，吃完跑得快！", options: opt({ label: "真香", icon: "😋", value: "ok" }, { label: "再来一碗", icon: "🍚", value: "ok" }), next: () => "f3" },
    f2_noodle: { id: "f2_noodle", text: "面条长长的，嗦一口滑溜溜！", options: opt({ label: "真滑", icon: "😋", value: "ok" }, { label: "还会甩", icon: "🤪", value: "ok" }), next: () => "f3" },
    f3: {
      id: "f3",
      text: "你今天吃饱饱了吗？吃饱才有力气玩哦！",
      options: opt(
        { label: "玩个游戏", icon: "🎮", value: "game" },
        { label: "听故事", icon: "📖", value: "story" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => (c === "game" ? "__game__" : c === "story" ? "__story__" : "__switch__"),
    },
  },
};

/** 家庭主题 */
const family: Topic = {
  id: "family",
  name: "家人",
  emoji: "👨‍👩‍👧",
  tint: "sky",
  root: "fa1",
  nodes: {
    fa1: {
      id: "fa1",
      text: "在家里，你最喜欢和谁一起玩呀？",
      options: opt(
        { label: "妈妈", icon: "👩", value: "mom" },
        { label: "爸爸", icon: "👨", value: "dad" },
        { label: "爷爷奶奶", icon: "👵", value: "gp" },
      ),
      next: (c) => "fa2_" + c,
    },
    fa2_mom: { id: "fa2_mom", text: "妈妈最爱你，会给你做好吃的，还会抱抱你～", options: opt({ label: "妈妈最棒", icon: "❤️", value: "ok" }), next: () => "fa3" },
    fa2_dad: { id: "fa2_dad", text: "爸爸力气大，可以把你举高高，像飞机一样！", options: opt({ label: "举高高", icon: "✈️", value: "ok" }), next: () => "fa3" },
    fa2_gp: { id: "fa2_gp", text: "爷爷奶奶会给你讲故事，还会偷偷塞糖糖～", options: opt({ label: "好幸福", icon: "🥰", value: "ok" }), next: () => "fa3" },
    fa3: {
      id: "fa3",
      text: "家是世界上最温暖的地方，抱住自己说「我爱我家人」",
      options: opt(
        { label: "抱抱自己", icon: "🤗", value: "hug" },
        { label: "听故事", icon: "📖", value: "story" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => (c === "hug" ? "fa4" : c === "story" ? "__story__" : "__switch__"),
    },
    fa4: {
      id: "fa4",
      text: "好棒！给自己一个大大的抱抱～",
      options: opt(
        { label: "玩个游戏", icon: "🎮", value: "game" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => (c === "game" ? "__game__" : "__switch__"),
    },
  },
};

/** 情绪主题 */
const feelings: Topic = {
  id: "feelings",
  name: "心情",
  emoji: "💗",
  tint: "lavender",
  root: "fe1",
  nodes: {
    fe1: {
      id: "fe1",
      text: "今天你感觉怎么样呀？",
      options: opt(
        { label: "开心", icon: "😄", value: "happy" },
        { label: "一点点难过", icon: "😢", value: "sad" },
        { label: "想睡觉", icon: "😴", value: "sleepy" },
      ),
      next: (c) => "fe2_" + c,
    },
    fe2_happy: { id: "fe2_happy", text: "开心就要笑一笑，笑一笑会变得更开心哦！", options: opt({ label: "哈哈哈", icon: "😆", value: "ok" }), next: () => "fe3" },
    fe2_sad: { id: "fe2_sad", text: "哭也没关系，告诉小星为什么好吗？小星陪你～", options: opt({ label: "抱抱我", icon: "🤗", value: "ok" }, { label: "想妈妈", icon: "👩", value: "ok" }), next: () => "fe3" },
    fe2_sleepy: { id: "fe2_sleepy", text: "那我们一起做个安静的事情吧？", options: opt({ label: "听故事", icon: "📖", value: "story" }, { label: "聊聊天", icon: "💬", value: "ok" }), next: () => "fe3" },
    fe3: {
      id: "fe3",
      text: "心情就像天气，有时候太阳，有时候下雨，都没关系～",
      options: opt(
        { label: "玩个游戏", icon: "🎮", value: "game" },
        { label: "听故事", icon: "📖", value: "story" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => (c === "game" ? "__game__" : c === "story" ? "__story__" : "__switch__"),
    },
  },
};

/** 想象主题 */
const imagine: Topic = {
  id: "imagine",
  name: "想象",
  emoji: "🚀",
  tint: "lavender",
  root: "i1",
  nodes: {
    i1: {
      id: "i1",
      text: "如果能飞，你想去哪里呀？",
      options: opt(
        { label: "云朵上", icon: "☁️", value: "cloud" },
        { label: "月亮上", icon: "🌙", value: "moon" },
        { label: "海底", icon: "🐠", value: "sea" },
      ),
      next: (c) => "i2_" + c,
    },
    i2_cloud: { id: "i2_cloud", text: "云朵软软的，我们可以躺在上面打滚～", options: opt({ label: "好软", icon: "😌", value: "ok" }), next: () => "i3" },
    i2_moon: { id: "i2_moon", text: "月亮弯弯像香蕉，我们可以啃一口！", options: opt({ label: "嘎嘣脆", icon: "🌙", value: "ok" }), next: () => "i3" },
    i2_sea: { id: "i2_sea", text: "海底有彩色的小鱼，还会跟你打招呼！", options: opt({ label: "你好呀", icon: "🐟", value: "ok" }), next: () => "i3" },
    i3: {
      id: "i3",
      text: "想象的世界什么都有，我们一起画一画吧？",
      options: opt(
        { label: "玩个游戏", icon: "🎮", value: "game" },
        { label: "听故事", icon: "📖", value: "story" },
        { label: "换话题", icon: "🔄", value: "switch" },
      ),
      next: (c) => (c === "game" ? "__game__" : c === "story" ? "__story__" : "__switch__"),
    },
  },
};

export const TOPICS: Topic[] = [animals, colors, food, family, feelings, imagine];

export function getTopic(id: string): Topic {
  return TOPICS.find((t) => t.id === id) || TOPICS[0];
}
