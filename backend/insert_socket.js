const fs = require('fs');
let content = fs.readFileSync('src/socket.js', 'utf8');

const insertBefore = '\t\t// ─── Toggle reaction on message ────────────────────────\r\n';

const newBlock = [
  '\t\t// ─── Delete a single message ──────────────────────────\r\n',
  "\t\tsocket.on('chat:deleteMessage', async ({ conversationId, messageId }, callback) => {\r\n",
  '\t\t\ttry {\r\n',
  '\t\t\t\tconst result = await chatService.deleteMessage(messageId, userId);\r\n',
  "\t\t\t\tif (!result) return callback?.({ error: 'Message not found' });\r\n",
  "\t\t\t\tif (result.forbidden) return callback?.({ error: \"Cannot delete another user's message\" });\r\n",
  '\r\n',
  '\t\t\t\tio.to(`conversation:${conversationId}`).emit(\'chat:messageDeleted\', {\r\n',
  '\t\t\t\t\tconversationId,\r\n',
  '\t\t\t\t\tmessageId,\r\n',
  '\t\t\t\t\tmessage: result.message,\r\n',
  '\t\t\t\t});\r\n',
  '\t\t\t\tcallback?.({ success: true });\r\n',
  '\t\t\t} catch (err) {\r\n',
  "\t\t\t\tconsole.error('chat:deleteMessage error:', err);\r\n",
  "\t\t\t\tcallback?.({ error: 'Failed to delete message' });\r\n",
  '\t\t\t}\r\n',
  '\t\t});\r\n',
  '\r\n',
  '\t\t// ─── Toggle reaction on message ────────────────────────\r\n',
].join('');

if (content.includes(insertBefore)) {
  content = content.replace(insertBefore, newBlock);
  fs.writeFileSync('src/socket.js', content, 'utf8');
  console.log('Done');
} else {
  console.log('Marker not found');
}
