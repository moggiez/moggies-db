#!/bin/bash
echo "Enter Github access token:"
read gh_token
echo "" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=${gh_token}" >> .npmrc