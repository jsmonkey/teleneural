Teleneural is a telegram bot powered with OpenAI.

With help of Telegram API it may emulate any user in a chat and keep conversation going.

# Quickstart

## Installation
Download the source code using [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).
```
git clone https://github.com/jsmonkey/teleneural.git
```

To get the bot running you need to install `Node v16+` and `npm v8+` on your machine. Detailed guide can be found [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

For a propper functioning the bot's workflow requires several credentials to be provided.

### OpenAI
Register and obtain your `API auth key` following the [manual](https://beta.openai.com/docs/api-reference/authentication).

### Telegram
Register a telegram app for your account and receive credentials (`api_id/api_hash`) according to this [guide](https://core.telegram.org/api/obtaining_api_id#obtaining-api-id).

## Launch
To pass the credentials into the bot create `.env` file in the root folder of the cloned project.

File contents: 
```shell
# .env

API_ID=<telegram_api_id> 
API_HASH=<telegram_api_hash> 
OPEN_AI_KEY=<open_ai_auth_key> 
CHAT_NAME=<name_of_the_target_chat>
CHAT_CONTEXT=<initial_chat_context> # E.g. The following is a chat. <user_name> reluctantly answers questions with sarcastic responses.
```
`<user_name>` is going to be replaced with the account's holder name.

To launch the bot run this terminal command inside the root project folder:
```
npm run bot:launch
```

## Enjoy the show!
