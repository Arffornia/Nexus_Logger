# Nexus Logger

This package lets you log any message you want.

## Install : 

To include Nexus Logger in your project, you can install it using npm:
```bash
npm i @arffornia/nexus_logger
```

## Usage :

#### Init 
At the beginning, you must initialize an instance of NexusLogger with the path of the save file :

```typescript
const logger = new NexusLogger(loggerFilePath);
```

#### Log a message : 

You can choose different prefix for your log message:
- [Debug]\: `logger.debug(message)` 
- [Info]\: `logger.info(message)`
- [Warn]\: `logger.warn(message)`
- [Error]\: `logger.error(message)`


## Tests

Tests are managed by **Jest** 

You can run the tests using :

```bash
npm test
```

## License

This project is licensed under the MIT licence. You can consult the complete text of the licence in the file [LICENSE](LICENSE).



