
[ ] System terminal and file system support. See Roos system prompt
[ ] SoMe support, facebook, insta, etc.
[ ] Maybe some better xml handling?
[ ] Handling errors from tools


[-] Create some kind of file logging with full conversation for each task, for debugging. <!-- Utility created in backend/src/utils/logger.ts. Next step: Integration. -->
[x] MCP Consumer Tool framework - Added back to provide MCP server interaction capabilities
[x] MCP Server protocol implementation - Complete the actual MCP protocol communication using npm: https://github.com/modelcontextprotocol and the Client <!-- COMPLETED: Full implementation using @modelcontextprotocol/sdk with stdio transport, connection management, and real protocol communication. -->
[x] Generic browser support for searching

[X] The Butler task should be able to reach out with events and also getting feedback on ask_followup_question.
[X] Create a backend that can somehow have a running butler task or something.
[X] Create a CLI that can handle ask_followup_question.
[X] Backend should do real reloading when files are changed
[X] CLI should reconnect the web socket and show some disconnected info in the shell.
[X] Better logging than console log.