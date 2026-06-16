// 对话状态机
// 接收小星话语、用户选项，输出下一节点
// 模拟"主动说话"：每 3 轮邀请游戏/故事；沉默 8 秒主动挑起

import { Topic, TopicNode, TOPICS, getTopic } from "./topics";

export type BotCmd = "game" | "story" | "switch" | "idle" | "none";

export type DialogueState = {
  topicId: string;
  nodeId: string;
  turns: number; // 在当前主题累积的轮数
  history: { from: "bot" | "kid"; text: string; ts: number }[];
};

export type StepResult = {
  botText: string;
  options?: TopicNode["options"];
  nextCmd: BotCmd;
  topicId: string;
  nodeId: string;
};

function initial(topicId = TOPICS[0].id): DialogueState {
  const topic = getTopic(topicId);
  return {
    topicId: topic.id,
    nodeId: topic.root,
    turns: 0,
    history: [],
  };
}

function pickNextTopic(currentId: string): string {
  const idx = TOPICS.findIndex((t) => t.id === currentId);
  const next = TOPICS[(idx + 1) % TOPICS.length];
  return next.id;
}

/**
 * 构造一个"主动邀请"的中间节点。会在 2-3 轮后注入。
 */
function offerNode(kind: "game" | "story" | "switch"): TopicNode {
  if (kind === "game") {
    return {
      id: "offer_game",
      text: "我们一起玩个游戏好不好呀？",
      options: [
        { label: "好呀！", icon: "🎮", value: "go" },
        { label: "再聊聊", icon: "💬", value: "stay" },
      ],
      next: (c) => (c === "go" ? "__game__" : "__stay__"),
    };
  }
  if (kind === "story") {
    return {
      id: "offer_story",
      text: "小星给你讲个小故事吧，竖起耳朵哦～",
      options: [
        { label: "想听！", icon: "📖", value: "go" },
        { label: "再聊聊", icon: "💬", value: "stay" },
      ],
      next: (c) => (c === "go" ? "__story__" : "__stay__"),
    };
  }
  return {
    id: "offer_switch",
    text: "我们换个新话题吧？小星想听你分享别的～",
    options: [
      { label: "好呀", icon: "🔄", value: "go" },
      { label: "再聊聊", icon: "💬", value: "stay" },
    ],
    next: (c) => (c === "go" ? "__switch__" : "__stay__"),
  };
}

/**
 * 启动一个主题：进入根节点
 */
export function start(topicId?: string): { state: DialogueState; result: StepResult } {
  const state = initial(topicId);
  const topic = getTopic(state.topicId);
  const node = topic.nodes[state.nodeId];
  return {
    state,
    result: { ...nodeToResult(topic, node), nextCmd: "none" },
  };
}

/**
 * 接收用户选择 value，推动状态机前进
 */
export function reply(state: DialogueState, value: string): { state: DialogueState; result: StepResult } {
  const topic = getTopic(state.topicId);
  const cur = topic.nodes[state.nodeId];

  // 记录 kid 的回复
  const kidText = cur.options?.find((o) => o.value === value)?.label || value;
  const newHistory = [...state.history, { from: "kid" as const, text: kidText, ts: Date.now() }];

  if (!cur.next) {
    return {
      state: { ...state, history: newHistory, turns: state.turns + 1 },
      result: offerThenEnd(topic.id),
    };
  }

  const nextId = cur.next(value);

  // 命令型跳转
  if (nextId === "__game__") return cmdResult("game", topic, state, newHistory);
  if (nextId === "__story__") return cmdResult("story", topic, state, newHistory);
  if (nextId === "__switch__") {
    return switchTopic(state, newHistory);
  }
  if (nextId === "__stay__") {
    // 用户选择"再聊聊"——继续当前主题根节点之后的一个新节点
    const stay = topic.nodes[topic.root === cur.id ? "a3" : Object.keys(topic.nodes).find((k) => k !== cur.id && k !== topic.root)!];
    if (stay) {
      const ns = { ...state, history: newHistory, nodeId: stay.id, turns: state.turns + 1 };
      return { state: ns, result: { ...nodeToResult(topic, stay), nextCmd: "none", topicId: topic.id, nodeId: stay.id } };
    }
  }

  const next = topic.nodes[nextId];
  if (!next) {
    return { state: { ...state, history: newHistory, turns: state.turns + 1 }, result: offerThenEnd(topic.id) };
  }

  const turns = state.turns + 1;
  const hist2 = [...newHistory, { from: "bot" as const, text: next.text, ts: Date.now() }];

  // 每 3 轮插入一次主动邀请
  if (turns > 0 && turns % 3 === 0 && !isOfferNode(next)) {
    const kind: "game" | "story" | "switch" = turns % 6 === 0 ? "story" : "game";
    const offer = offerNode(kind);
    return {
      state: { topicId: topic.id, nodeId: offer.id, turns, history: hist2 },
      result: { ...nodeToResult(topic, offer), nextCmd: "none", topicId: topic.id, nodeId: offer.id },
    };
  }

  return {
    state: { topicId: topic.id, nodeId: next.id, turns, history: hist2 },
    result: { ...nodeToResult(topic, next), nextCmd: "none", topicId: topic.id, nodeId: next.id },
  };
}

function isOfferNode(n: TopicNode) {
  return n.id === "offer_game" || n.id === "offer_story" || n.id === "offer_switch";
}

function nodeToResult(topic: Topic, node: TopicNode): { botText: string; options: TopicNode["options"]; topicId: string; nodeId: string } {
  return { botText: node.text, options: node.options, topicId: topic.id, nodeId: node.id };
}

function cmdResult(cmd: BotCmd, topic: Topic, state: DialogueState, history: DialogueState["history"]): { state: DialogueState; result: StepResult } {
  return {
    state: { ...state, history },
    result: { botText: "", options: undefined, nextCmd: cmd, topicId: topic.id, nodeId: state.nodeId },
  };
}

function offerThenEnd(topicId: string): StepResult {
  return { botText: "我们玩个游戏吧？", options: [{ label: "好呀", icon: "🎮", value: "go" }], nextCmd: "game", topicId, nodeId: "end" };
}

function switchTopic(state: DialogueState, history: DialogueState["history"]): { state: DialogueState; result: StepResult } {
  const newId = pickNextTopic(state.topicId);
  const topic = getTopic(newId);
  const node = topic.nodes[topic.root];
  return {
    state: { topicId: newId, nodeId: node.id, turns: 0, history: [...history, { from: "bot" as const, text: node.text, ts: Date.now() }] },
    result: { ...nodeToResult(topic, node), nextCmd: "none", topicId: newId, nodeId: node.id },
  };
}

/**
 * 沉默时主动说话：随机从 offers 中挑一个，或者播报一句提示
 */
export function idlePrompt(state: DialogueState): StepResult {
  const opts: Array<"game" | "story" | "switch"> = ["game", "story", "switch"];
  const pick = opts[Math.floor(Math.random() * opts.length)];
  if (pick === "switch") {
    const newId = pickNextTopic(state.topicId);
    const topic = getTopic(newId);
    const node = topic.nodes[topic.root];
    return { ...nodeToResult(topic, node), nextCmd: "none", topicId: newId, nodeId: node.id };
  }
  const offer = offerNode(pick);
  return { ...nodeToResult(offerTopicForState(state), offer), nextCmd: "none", topicId: state.topicId, nodeId: offer.id };
}

function offerTopicForState(state: DialogueState) {
  return getTopic(state.topicId);
}
