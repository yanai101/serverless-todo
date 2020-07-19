#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { TodoAppStack } from "../lib/todo-app-stack";

const app = new cdk.App();
new TodoAppStack(app, "prod-cdk", {
  prod: true,
  env: {
    region: "eu-west-1",
  },
});
new TodoAppStack(app, "staging-cdk", {
  prod: false,
  env: {
    region: "eu-west-1",
  },
});
