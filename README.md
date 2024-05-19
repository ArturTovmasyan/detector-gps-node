# bus-nodejs

After cloning project you need install npm to get all necessary packages

```bashp
    npm install
```

Then to run it you will run.

```bashp
    node app.js
```

And if you want to specify envirenment you can done it by flowing command

```bashp
    NODE_ENV=dev node app.js
```

or for prod.

```bashp
    NODE_ENV=prod node app.js
```

Logs will work only for dev/prod envirenments.

Also project can be started via forever by this command

```bashp
    forever start app.js
```

and specify envirenment such.

```bashp
    NODE_ENV=dev forever start app.js
```

To view list of running tasks run

```bashp
    forever list
```

And to stop need to give id of process

```bashp
    forever stop id
```

If program running without forever we can see it by ubuntu command

```bashp
    ps aux | grep node
    kill -9 processID
```

For Testing The project you have to install Mocha by global
```bashp
    npm install -g mocha
    Then run: mocha
```






