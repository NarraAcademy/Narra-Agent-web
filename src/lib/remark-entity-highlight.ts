import { visit } from 'unist-util-visit';
import type { Root, Text, Parent } from 'mdast';

export interface Entity {
  type: string;
  name: string;
  mentions: Array<{ text: string; context?: string }>;
}

interface KeywordInfo {
  text: string;
  type: string;
  name: string;
}

/**
 * Remark plugin: 在 markdown AST 中为实体文本注入 <entity-highlight> HTML 标签
 *
 * @param entities - 实体数组
 * @returns remark transformer
 */
export default function remarkEntityHighlight(entities: Entity[] = []) {
  console.log('🔧 [remarkEntityHighlight] Plugin initialized with', entities.length, 'entities');

  // 提取所有关键词并按长度倒序排列（最长匹配优先）
  const keywords: KeywordInfo[] = entities
    .flatMap((entity) =>
      entity.mentions.map((m) => ({
        text: m.text,
        type: entity.type,
        name: entity.name,
      }))
    )
    .sort((a, b) => b.text.length - a.text.length);

  if (keywords.length === 0) {
    console.log('⚠️  [remarkEntityHighlight] No keywords, skipping');
    return () => {}; // 无实体时跳过处理
  }

  console.log('📝 [remarkEntityHighlight] Keywords:', keywords.map(k => k.text).join(', '));

  // 转义正则特殊字符
  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 构建正则表达式（单词边界 + 不区分大小写）
  const pattern = keywords.map((k) => escapeRegex(k.text)).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  console.log('🎯 [remarkEntityHighlight] Regex pattern:', regex);

  return (tree: Root) => {
    console.log('🌲 [remarkEntityHighlight] Processing markdown tree');
    let processedCount = 0;

    visit(tree, 'text', (node: Text, index: number | null, parent: Parent | null) => {
      if (!node.value || index === null || !parent) return;

      // 跳过代码块中的文本
      if (parent.type === 'code' || parent.type === 'inlineCode') {
        console.log('⏭️  [remarkEntityHighlight] Skipping code block:', node.value.slice(0, 50));
        return;
      }

      const matches = [...node.value.matchAll(regex)];
      if (matches.length === 0) return;

      console.log(`✅ [remarkEntityHighlight] Found ${matches.length} matches in:`, node.value.slice(0, 100));
      processedCount += matches.length;

      const newChildren: Array<Text | { type: 'html'; value: string }> = [];
      let lastIndex = 0;

      for (const match of matches) {
        const matchIndex = match.index!;

        // 添加匹配之前的文本
        if (matchIndex > lastIndex) {
          newChildren.push({
            type: 'text',
            value: node.value.slice(lastIndex, matchIndex),
          });
        }

        // 找到对应的实体（不区分大小写）
        const keyword = keywords.find(
          (k) => k.text.toLowerCase() === match[0].toLowerCase()
        );

        if (keyword) {
          // 转义 HTML 属性中的特殊字符
          const escapedType = keyword.type.replace(/"/g, '&quot;');
          const escapedName = keyword.name.replace(/"/g, '&quot;');
          const escapedText = match[0]
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

          // 注入自定义 HTML 标签
          newChildren.push({
            type: 'html',
            value: `<entity-highlight data-type="${escapedType}" data-name="${escapedName}">${escapedText}</entity-highlight>`,
          });
        } else {
          // 保留原文本（理论上不会发生）
          newChildren.push({
            type: 'text',
            value: match[0],
          });
        }

        lastIndex = matchIndex + match[0].length;
      }

      // 添加剩余文本
      if (lastIndex < node.value.length) {
        newChildren.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        });
      }

      // 替换原节点
      parent.children.splice(index, 1, ...newChildren);
    });

    console.log(`🎉 [remarkEntityHighlight] Processing complete. Total entities injected: ${processedCount}`);
  };
}
