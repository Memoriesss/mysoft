// 迷你故事库：每篇 4 屏翻页
export type Story = {
  id: string;
  title: string;
  pages: string[]; // 每页一句话
  emoji: string;
  tint: string; // 背景色
};

export const STORIES: Story[] = [
  {
    id: "s1",
    title: "小兔子的月亮",
    emoji: "🐰🌙",
    tint: "lavender",
    pages: [
      "小兔子抬头看，月亮好圆好亮呀。",
      "它想：月亮一定也很想有人陪。",
      "它抱来一颗最大的星星，送给月亮。",
      "月亮笑了，整片森林都暖洋洋的～",
    ],
  },
  {
    id: "s2",
    title: "小熊找蜂蜜",
    emoji: "🐻🍯",
    tint: "tangerine",
    pages: [
      "小熊最爱甜甜的蜂蜜啦。",
      "它爬过小山，走过小桥，咚咚咚！",
      "小蜜蜂说：自己动手才最香哦。",
      "小熊擦擦汗，啊呜一口，真甜！",
    ],
  },
  {
    id: "s3",
    title: "云朵上的小房子",
    emoji: "☁️🏠",
    tint: "sky",
    pages: [
      "云朵上有一间小小的房子。",
      "房子里住着一只小云猫，喵～",
      "它把彩虹当滑梯，从这头滑到那头。",
      "小云猫挥挥手：明天再来玩吧！",
    ],
  },
  {
    id: "s4",
    title: "会笑的小石头",
    emoji: "🪨😄",
    tint: "mint",
    pages: [
      "小河边有一颗圆圆的小石头。",
      "它被水流挠了挠脚底，咯咯笑。",
      "小鱼问：你为什么这么开心呀？",
      "小石头说：因为每天都能晒太阳呀～",
    ],
  },
];

export function pickStory(): Story {
  return STORIES[Math.floor(Math.random() * STORIES.length)];
}
