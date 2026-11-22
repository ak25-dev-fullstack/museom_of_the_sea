# Creatures design notes
what: Mythological creatures
branch: areeba-cyberz-work

## Why these creatures
Starting with Poseidon's children -> He would have the strongest reactions to his own family.
Starting off with: Polyphemus, Pegasus,Scylla and then will add more.. 
Other creatures i plan to add:
-

## Data format and why
1. id (lowercase) -> Code uses it to find the creature and other topics use it to link to it. AND doesn't changes.
2. name (display name) -> what the user sees on screen, CAN have capitals and spaces.
3. category (A group,E.g. giant,sea monster, hybird) -> Lets the chat answer "what giants do you know?" for example.. and group creatures together.
4. poseidonRelation (how the creature connects to poseidon) ->Drives poseidons attitude. E.g. Indifference to a stranger and more anger or pride towards his son?
5. summary (one-sentence answer) -> quick reply to questions, good for learning mode!
6. keywords (words user may type) -> Chat scans the user's message.
7. relatedFigures (Ids of connected characters) -> Powers follow up suggestions and links topics.
8. keyMyths (List of short facts and stories) -> list of things poseidon can say. More facts = less repetition.
## How creatures could feed the chat 


## AI use and how I verified it


## Open questions for the team
-Is my JSON format okay for the backend, in terms of field names etc.? 

-Is the file location okay for everyone?

-Should each creature have its own learning and immersion text? 

-Handling sensitive myths-e.g. Medusa

