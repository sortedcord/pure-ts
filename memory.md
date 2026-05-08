## 1. Core Philosophy: Subjective & Lossy Recall

The primary goal of the memory subsystem is to eliminate "NPC Omniscience." An entity's memory is **subjective, imperfect, and layered**. Entities do not remember raw world state changes; they remember their *perception* of those changes, colored by their traits, mood, and cognitive load at the exact moment the event occurred.

## 2. The Multi-Tiered Architecture (Storage)

Memory is split into three distinct layers to balance computational efficiency with narrative depth.

### Tier 1: Short-Term Buffer (Working Memory)

* **What it is:** A volatile, verbatim list of the last few turns of interaction.
* **Purpose:** Provides immediate, high-resolution context for active conversations (e.g., resolving pronouns like "this" or "that").
* **State:** Wiped clean automatically when a scene ends.

### Tier 2: The Vector Store (Long-Term Archive)

* **What it is:** A searchable database (FAISS/SQLite) of immutable `MemoryEntry` objects.
* **Purpose:** Stores the "historical record" of summarized events and internal thoughts.
* **State:** Permanent, but subject to retrieval decay.

### Tier 3: The Dossiers (Stateful Relationships)

* **What it is:** A dictionary mapping other entity IDs to a singular, evolving "Impression Object."
* **Purpose:** Provides an immediate "vibe check" for how an entity feels about someone without needing to query the entire database.
* **State:** Highly mutable. Overwritten whenever the entity experiences a paradigm shift regarding the target.

## 3. The Data Structure: The `MemoryEntry`

The atomic unit of the long-term archive. It separates *what happened* from *how the entity felt about it*.

### Schema Structure

```json
{
  "id": "mem_uuid_1234",
  "timestamp": "2026-04-18 17:30:00",
  "location_id": "tavern_main",
  "event_type": "observation", 
  "importance": 7,
  "entities": ["arthur_01"],
  "content": "Saw Arthur lingering near the ledger after dropping a glove.",
  "quotes": [],
  "monologue_layers": [
    {
      "thought": "Probably just clumsy.",
      "timestamp": "2026-04-18 17:30:05",
      "context_mood": "trusting"
    }
  ]
}

```

### Key Components:

* **`content` vs. `quotes`:** The engine strictly avoids saving full verbatim dialogues to long-term memory. The `content` holds a third-person narrative summary (the action). The `quotes` array only stores verbatim dialogue if the system tags a line with `high_salience` (e.g., a threat, a promise, a revelation).
* **Cognitive Layering (`monologue_layers`):** The system **never overwrites** an original thought. If new information changes the entity's perspective, a *new* thought is appended to the stack. This allows the NPC to experience "cognitive dissonance" and remember *being wrong*, which is vital for the Delta/Undo system.


## 4. The Consolidation Pipeline (Active $\rightarrow$ Archive)

This is the process of moving data from the volatile Buffer to the permanent Archive. To save LLM compute and simulate human attention, this process is strictly event-driven.

### Consolidation Triggers

1. **Scene Exit (Spatial):** The target entity moves out of the "Public" distance tier (e.g., leaves the room).
2. **Time Jump (Temporal):** The `WorldClock` advances by a significant margin (e.g., $\Delta t > 15 \text{ minutes}$).
3. **Cognitive Load (Technical):** The conversation buffer exceeds token limits, forcing a "mid-scene breath" to summarize.

### The Reflection Logic

When a trigger fires:

1. The LLM summarizes the raw buffer into the `content` string.
2. High-salience phrases are extracted into the `quotes` list.
3. The buffer is wiped.
4. *If* the summarized event contradicts a past belief, the LLM triggers a **Re-evaluation Hook**, pushing a new thought onto an older memory's `monologue_layers` stack and updating the target's **Dossier**.

## 5. The Retrieval Pipeline (Archive $\rightarrow$ Prompt)

When an entity needs to act, it cannot load its entire memory into the prompt. The RAG system acts as a "Funnel" to simulate imperfect recall.

### Step 1: Semantic Search

The system searches the Vector Store for the Top-K memories related to the current query or the entities in the room.

### Step 2: Time-Weighted Decay

A mathematical filter is applied to the search results to prioritize recent and important memories over older, trivial ones. The retrieval score ($S$) is calculated as:

$$S = R \times I \times e^{-\lambda t}$$

Where:

* $R$ = Semantic Relevance (from the Vector DB)
* $I$ = Base Importance (1-10 scale set during consolidation)
* $t$ = Time elapsed since the memory was formed
* $\lambda$ = The entity's specific "forgetfulness" trait constant

### Step 3: Salience Filtering & The Context Loader

If $S$ falls below a baseline threshold, the memory is discarded (the entity "forgets" it under pressure). The `ContextLoader` then formats the surviving memories into a dense narrative brief.

**Final Prompt Injection Example:**

> **CURRENT VIBE FOR ARTHUR:** A silver-tongued thief. (Trust: -8)
> **RELEVANT RECALL:**
> * You saw him near the ledger (Thought Stack: You thought he was clumsy $\rightarrow$ You later realized he was scouting to steal it).
> * He bought drinks and said "To the King!" (Thought: It was a bribe to lower your guard).
> 
> 

## 6. How the Subsystems Interact (The Lifecycle)

1. **Pulse (Spatial):** Arthur drops a coin. The `InteractionBus` broadcasts this through the Semantic Grid.
2. **Masking (Perception):** Barnaby is reading (High Focus). The middleware calculates distance and occlusion, determining the sound barely reaches him.
3. **Working Memory (Buffer):** Barnaby perceives "A faint clink." An immediate `internal_monologue` is generated: *"Just a rat in the walls."*
4. **Trigger (Consolidation):** Time advances 30 minutes. The buffer is collapsed into a `MemoryEntry` and saved to the DB.
5. **Re-evaluation (Cognitive Layering):** Later, Barnaby finds his coin purse empty. The engine queries for "clink/coins." It finds the memory. Barnaby generates a new layer: *"That wasn't a rat. He dropped one of my coins."* His Dossier for Arthur shifts to *Suspicious*.
6. **Retrieval (RAG):** When Arthur returns, the Context Loader pulls the layered memory and the updated Dossier, feeding them into the Architect to generate a hostile greeting.