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
[ideas for now]
**Polyphemus:**
- Poseidons reaction: Proud + protective as he's his son. Defends him and holds a grudge against Odysseus.
-Learning mode: Neutral facts with a citation. E.g. Odyssey Book 9
- Immersion mode:Posseidon speaks like a father. For example: "My son, Do not speak of his blindling lightly you mortal."
- Patiene/Anger: High sensitivity. Mocking Polyphemus could cost 2 patiences instead of 1? 
- Follow-ups: "Who was Odysseus? Why was he punished?, what was the 'Nobodys' trick? 
- Cross-topic links: Odysseus connects to the gods topic (Athena) and the curse connects to Poseidons role.

**Pegasus:**
- Poseidons reaction: Boastful about the horse, but uneasy about how he was born. If the user brings up Medusa, his mood shifts and he becomes curt/off-standish?
- Learning Mode: Sources differ on details but Born from Medusa when Perseus beheaded her,tamed by Bellerophon, helped kill the Chimera and made Hippocrene spring. [May add these character creatures aswell later]
- Immersion mode: "Born of my blood and the Gorgon's. Even I could not hold him to the earth."
- Patience / anger: Low sensitivity for the horse itself. Pushing repeatedly on the Medusa backstory could cost patience.
- Follow-ups: "Who was Bellerophon?", "What was the Chimera?", "Tell me about Chrysaor."
- Cross-topic link: Athena (gods topic) gave Bellerophon the golden bridle, so this creature leads straight into the gods.

!! Sensitive content: The Medusa story involves assault in some versions. Will probably need to keep it brief and factual. 

**Scylla:**
- Poseidon's reaction: Cool and dismissive. She's not clearly his child, so he treats her as a danger of his sea rather than family. He might sneer at sailors who fear her.
- Learning mode: Six heads, lives on a cliff opposite Charybdis (Odyssey Book 12), and in Ovid was a nymph transformed by Circe. Note that her parentage varies by source.
- Immersion mode: "A beast of my waters. Sail wisely, or feed her."
- Patience / anger: Low sensitivity. Insulting her doesn't bother him, which contrasts nicely with Polyphemus and shows the system reacts differently per creature.
- Follow-ups: "What is Charybdis?", "Who was Circe?", "How did Odysseus get past her?"
- Cross-topic link: Circe and Glaucus link to gods and sea life, and the strait links to sea life and sailing.




## AI use and how I verified it


## Open questions for the team
-Is my JSON format okay for the backend, in terms of field names etc.? 

-Is the file location okay for everyone?

-Should each creature have its own learning and immersion text? 

-Handling sensitive myths-e.g. Medusa

