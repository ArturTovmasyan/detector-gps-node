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

After project setup need to create config/parameters.js to write machine parameters.

For creating tables need to run
```bashp
    node app/console.js
```
command with necessary parameters.
=======
**Edit a file, create a new file, and clone from Bitbucket in under 2 minutes**

When you're done, you can delete the content in this README and update the file with details for others getting started with your repository.

*We recommend that you open this README in another tab as you perform the tasks below. You can [watch our video](https://youtu.be/0ocf7u76WSo) for a full demo of all the steps in this tutorial. Open the video in a new tab to avoid leaving Bitbucket.*

---

## Edit a file

You’ll start by editing this README file to learn how to edit a file in Bitbucket.

1. Click **Source** on the left side.
2. Click the README.md link from the list of files.
3. Click the **Edit** button.
4. Delete the following text: *Delete this line to make a change to the README from Bitbucket.*
5. After making your change, click **Commit** and then **Commit** again in the dialog. The commit page will open and you’ll see the change you just made.
6. Go back to the **Source** page.

---

## Create a file

Next, you’ll add a new file to this repository.

1. Click the **New file** button at the top of the **Source** page.
2. Give the file a filename of **contributors.txt**.
3. Enter your name in the empty file space.
4. Click **Commit** and then **Commit** again in the dialog.
5. Go back to the **Source** page.

Before you move on, go ahead and explore the repository. You've already seen the **Source** page, but check out the **Commits**, **Branches**, and **Settings** pages.

---

## Clone a repository

Use these steps to clone from SourceTree, our client for using the repository command-line free. Cloning allows you to work on your files locally. If you don't yet have SourceTree, [download and install first](https://www.sourcetreeapp.com/). If you prefer to clone from the command line, see [Clone a repository](https://confluence.atlassian.com/x/4whODQ).

1. You’ll see the clone button under the **Source** heading. Click that button.
2. Now click **Check out in SourceTree**. You may need to create a SourceTree account or log in.
3. When you see the **Clone New** dialog in SourceTree, update the destination path and name if you’d like to and then click **Clone**.
4. Open the directory you just created to see your repository’s files.

Now that you're more familiar with your Bitbucket repository, go ahead and add a new file locally. You can [push your change back to Bitbucket with SourceTree](https://confluence.atlassian.com/x/iqyBMg), or you can [add, commit,](https://confluence.atlassian.com/x/8QhODQ) and [push from the command line](https://confluence.atlassian.com/x/NQ0zDQ).
