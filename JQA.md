# JQA RELEASE GATE v1.1.1

## Live URLs
- /
- /original/
- /full/
- /v1-0-full/
- /v1-1-full/
- /v1-1-1-full/

## Required browser checks
- HTTP 200
- login
- equipment create
- customer create
- sales create with equipment
- global search
- UX next-action after save
- mobile bottom navigation
- calendar CRUD
- accounting edit persistence
- no console/page errors

## Release rule
A version is not RELEASE PASS until the live GitHub Pages build passes the browser JQA gate.
