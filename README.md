# mybuzz-user SDK

This repository contains the javascript SDK for communicating with mybuzz-user API's

## How to setup

First you need [node.js](https://nodejs.org/en/) v8.12.0 and [yarn](https://yarnpkg.com/) installed. We recommend using [nvm](https://github.com/creationix/nvm) to be able to install and switch between different versions of node.js.

Clone the repository by running:

```
git clone https://github.com/moustaphadiakhate/mybuzzmessaging.git

```

Then cd into it:

```
cd mybuzz-user-sdk
```

Run yarn to install the dependencies

```
yarn install
```

## Run it

Since the sdk is headless, the only thing we run in it are tests that validate that it's components are functioning correctly.

To run them, run:
```
yarn test
```

You can also live test the sdk in the projects it is used in (such as `mybuzz-user-mobile`) by using the `yarn link` command. This allows you to directly test your changes in the project without deploying to NPM first. For that you will need to first run:
```
yarn link
```
and then run the webpack server in watch mode by running:
```
yarn webpack -w
```

After that, go into the project that uses the sdk and run:
```
yarn link @sunutech/mybuzz-user-sdk
```

Your changes should now be reflected in real time.

## Developing features

The sdk is split into multiple clients, one for each api we consume. Every client is a singleton in the sdk and contains methods that allow it to communicate with the diffrerent API's. Information is usually not shared between the clients to keep them simple. They only act as wrappers around the API's to ease their consumption. To exchange authentication data, a TokenRepository is shared between all the clients.

## Deployment

The sdk is deployed to our private organization on [npm](https://www.npmjs.com/). To deploy, run:
```
yarn publish
```

Make sure you have been added to the npm organization first and that you are logged in with your npm account.
