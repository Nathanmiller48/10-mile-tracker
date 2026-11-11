// GENERATED from PLAN.md sections 3–11 by scripts/build-content.mjs. Do not edit by hand.
// To change training content: edit PLAN.md (with Nate's say-so), then run: npm run build:data

export const WEEKLY_TEMPLATE = {
 "Mon": {
  "morning": "Legs + Armor strength",
  "doneBy": "11:15",
  "evening": "Climb — Hard (limit bouldering)"
 },
 "Tue": {
  "morning": "Easy run",
  "doneBy": "7:30",
  "evening": "Off (drive to MSU)"
 },
 "Wed": {
  "morning": "Reset — active recovery, no equipment",
  "doneBy": "7:00",
  "evening": "Climb — Medium (technique/volume)"
 },
 "Thu": {
  "morning": "Easy run + Armor mini-circuit",
  "doneBy": null,
  "evening": "Off. Full upper-body rest"
 },
 "Fri": {
  "morning": "Lock & Pull (back/biceps for climbing)",
  "doneBy": "7:30",
  "evening": "Climb — Easy (flow, optional)"
 },
 "Sat": {
  "morning": "Long run",
  "doneBy": null,
  "evening": "Off"
 },
 "Sun": {
  "morning": "Low-impact aerobic — active recovery",
  "doneBy": null,
  "evening": "Off"
 }
};

export const SESSION_LABELS = {
 "RUN-E": "easy run",
 "RUN-L": "long run",
 "STR-A": "Legs + Armor",
 "ARM-B": "Armor mini-circuit",
 "PULL": "Lock & Pull",
 "RESET": "active recovery",
 "AER": "low-impact aerobic",
 "WALK": "easy walk only",
 "CLIMB-H": "hard climb",
 "CLIMB-M": "medium climb",
 "CLIMB-E": "easy climb"
};

export const SESSIONS = {
 "RUN-E": {
  "id": "RUN-E",
  "name": "Easy run",
  "label": "easy run",
  "when": null,
  "minutes": null,
  "blocks": [
   {
    "t": "ul",
    "items": [
     {
      "text": "5 min brisk walk, 10 leg swings each way, 10 calf raises, 10 tibialis raises against a wall. Then run."
     },
     {
      "text": "Effort: full sentences. If you can't talk, slow down. Pace is whatever that effort gives you."
     },
     {
      "text": "Form (these matter for a front-of-shin problem):",
      "children": [
       {
        "text": "**Shorter, quicker steps.** Count steps for 30 s on your first run and double it. If you're under ~165, aim 5% higher using a free metronome app. Heiderscheit et al. (2011) showed a 5–10% step-rate increase shortens the stride and cuts braking and joint loading."
       },
       {
        "text": "Land with your foot under you, not out in front with toes yanked up. That toes-up heel strike is what overworks the muscle on the front of the shin."
       },
       {
        "text": "Quiet feet. If you can hear slapping, shorten the step."
       },
       {
        "text": "Avoid long downhills, and don't lace the top of the shoe tight across the ankle."
       }
      ]
     },
     {
      "text": "5 min walk after."
     },
     {
      "text": "**Strides** (from week 4, only if green for 2 weeks): 4 × 15–20 s smooth accelerations to \"fast but relaxed\" on flat ground, full walk-back recovery."
     }
    ]
   }
  ]
 },
 "RUN-L": {
  "id": "RUN-L",
  "name": "Long run",
  "label": "long run",
  "when": null,
  "minutes": null,
  "blocks": [
   {
    "t": "ul",
    "items": [
     {
      "text": "Same as the easy run, and start the first mile slower than feels necessary."
     },
     {
      "text": "Nonstop is the goal and what counts for milestones. If your form falls apart, a 30–60 s walk break (Galloway's method) is better than limping the distance. The run still counts as training, not as the milestone."
     },
     {
      "text": "From 7 miles up: carry water or loop past it, and take 20–30 g of carbs around 45 min and again around 75 min. Practice this on Dec 5 and Dec 19."
     },
     {
      "text": "Stop rule: shin hits 3/10 → walk home. See section 7."
     }
    ]
   }
  ]
 },
 "STR-A": {
  "id": "STR-A",
  "name": "Legs + Armor",
  "label": "Legs + Armor",
  "when": "Monday, 55–60 min",
  "minutes": [
   55,
   60
  ],
  "blocks": [
   {
    "t": "p",
    "text": "Heavy, low volume, always 2–3 reps left in the tank. After week 2 you should not be sore past Tuesday morning. If you are, drop a set."
   },
   {
    "t": "table",
    "head": [
     "#",
     "Exercise",
     "Sets × reps",
     "Notes"
    ],
    "rows": [
     [
      "—",
      "Warm-up",
      "8 min",
      "5 min bike, leg swings, 10 squats, 10 calf raises"
     ],
     [
      "1",
      "Trap-bar deadlift",
      "3 × 5",
      "2–3 min rest. Add 5–10 lb when all sets feel like 3 in reserve"
     ],
     [
      "2",
      "Rear-foot-elevated split squat",
      "3 × 6/side",
      "Dumbbells. Slow down, drive up"
     ],
     [
      "3",
      "Single-leg calf raise off a step (straight knee)",
      "3 × 8–10/side",
      "Hold a dumbbell. 2 s up, 3 s down, full range"
     ],
     [
      "4",
      "Seated calf raise (bent knee, soleus)",
      "3 × 10–12",
      "Heavy. 1 s pause at the bottom"
     ],
     [
      "5",
      "Tibialis raise (back on wall, heels ~12 in out, or tib bar)",
      "3 × 15–25",
      "Keep the sore spot ≤2/10. If it bites, shorten the range"
     ],
     [
      "6",
      "Lateral band walk + single-leg RDL reach",
      "2 × 12/side each",
      "Hip stability. Bodyweight on the RDL"
     ],
     [
      "7",
      "Backward sled drag (or backward walk on an inclined treadmill)",
      "4 × 20–30 m (or 5 min)",
      "Finisher. Loads quads and tibialis with almost no soreness"
     ],
     [
      "8",
      "Ab wheel or dead bug",
      "3 × 8–10",
      ""
     ]
    ]
   },
   {
    "t": "p",
    "text": "Weeks 1–2: 2 sets on lifts 1–5. Week 5: 2 sets, 35 min. Week 6: skipped. Week 7: 2 sets. Week 8: none."
   }
  ],
  "exercises": [
   {
    "n": null,
    "name": "Warm-up",
    "dose": "8 min",
    "notes": "5 min bike, leg swings, 10 squats, 10 calf raises"
   },
   {
    "n": 1,
    "name": "Trap-bar deadlift",
    "dose": "3 × 5",
    "notes": "2–3 min rest. Add 5–10 lb when all sets feel like 3 in reserve"
   },
   {
    "n": 2,
    "name": "Rear-foot-elevated split squat",
    "dose": "3 × 6/side",
    "notes": "Dumbbells. Slow down, drive up"
   },
   {
    "n": 3,
    "name": "Single-leg calf raise off a step (straight knee)",
    "dose": "3 × 8–10/side",
    "notes": "Hold a dumbbell. 2 s up, 3 s down, full range"
   },
   {
    "n": 4,
    "name": "Seated calf raise (bent knee, soleus)",
    "dose": "3 × 10–12",
    "notes": "Heavy. 1 s pause at the bottom"
   },
   {
    "n": 5,
    "name": "Tibialis raise (back on wall, heels ~12 in out, or tib bar)",
    "dose": "3 × 15–25",
    "notes": "Keep the sore spot ≤2/10. If it bites, shorten the range"
   },
   {
    "n": 6,
    "name": "Lateral band walk + single-leg RDL reach",
    "dose": "2 × 12/side each",
    "notes": "Hip stability. Bodyweight on the RDL"
   },
   {
    "n": 7,
    "name": "Backward sled drag (or backward walk on an inclined treadmill)",
    "dose": "4 × 20–30 m (or 5 min)",
    "notes": "Finisher. Loads quads and tibialis with almost no soreness"
   },
   {
    "n": 8,
    "name": "Ab wheel or dead bug",
    "dose": "3 × 8–10",
    "notes": ""
   }
  ]
 },
 "ARM-B": {
  "id": "ARM-B",
  "name": "Armor mini-circuit",
  "label": "Armor mini-circuit",
  "when": "Thursday after the run, 12–15 min",
  "minutes": [
   12,
   15
  ],
  "blocks": [
   {
    "t": "p",
    "text": "Low-soreness on purpose; it's 48 hours before the long run."
   },
   {
    "t": "ul",
    "items": [
     {
      "text": "Single-leg bent-knee calf isometric hold: 3 × 30 s/side"
     },
     {
      "text": "Tibialis raise: 2 × 15"
     },
     {
      "text": "Side plank with top-leg lift: 2 × 8/side"
     },
     {
      "text": "Single-leg balance, eyes closed: 2 × 30 s/side"
     },
     {
      "text": "Kneeling shin stretch + calf stretch: 2 × 30 s each"
     }
    ]
   }
  ],
  "exercises": [
   {
    "n": 1,
    "name": "Single-leg bent-knee calf isometric hold",
    "dose": "3 × 30 s/side",
    "notes": ""
   },
   {
    "n": 2,
    "name": "Tibialis raise",
    "dose": "2 × 15",
    "notes": ""
   },
   {
    "n": 3,
    "name": "Side plank with top-leg lift",
    "dose": "2 × 8/side",
    "notes": ""
   },
   {
    "n": 4,
    "name": "Single-leg balance, eyes closed",
    "dose": "2 × 30 s/side",
    "notes": ""
   },
   {
    "n": 5,
    "name": "Kneeling shin stretch + calf stretch",
    "dose": "2 × 30 s each",
    "notes": ""
   }
  ]
 },
 "PULL": {
  "id": "PULL",
  "name": "Lock & Pull",
  "label": "Lock & Pull",
  "when": "Friday, 45–50 min",
  "minutes": [
   45,
   50
  ],
  "blocks": [
   {
    "t": "p",
    "text": "Bar and rings only. No small edges, so fingers are spared."
   },
   {
    "t": "table",
    "head": [
     "#",
     "Exercise",
     "Sets × reps",
     "Notes"
    ],
    "rows": [
     [
      "—",
      "Warm-up",
      "8 min",
      "Band pull-aparts 2×15, scapular pull-ups 2×8, band external rotation 2×12, 2 easy sets of 5 pull-ups"
     ],
     [
      "1",
      "Weighted pull-up",
      "4 × 4",
      "1 s pause chin-over-bar, controlled lower, shoulders stay engaged at the bottom. 3 min rest. Start with a load you could do 6–7 times (roughly +10–20% bodyweight). +5 lb when all sets are clean. Stop 2 reps short of failure"
     ],
     [
      "2",
      "Lock-off ladder",
      "3 rounds",
      "One pull: hold 5 s at the top, 5 s at 90°, 5 s at ~120°, lower. 2–3 min rest. From week 3: uneven grip (one hand on a towel 12–18 in lower), 4 rounds, alternate the high hand"
     ],
     [
      "3",
      "Single-arm row, neutral grip (cable or dumbbell)",
      "3 × 8/side",
      "1 s pause at the ribs"
     ],
     [
      "4",
      "Hammer curl",
      "2 × 8",
      "3 s lowers. Trains the lock-off muscles (brachialis, brachioradialis); neutral grip is easier on the inner elbow than supinated curls"
     ],
     [
      "5",
      "Antagonist circuit",
      "2–3 rounds",
      "Push-ups × 12–15, face pulls or band external rotation × 15, light reverse wrist curl × 15"
     ],
     [
      "6",
      "Tuck front-lever hold (or hanging knee raise × 8)",
      "3 × 8–10 s",
      "Body tension"
     ]
    ]
   },
   {
    "t": "p",
    "text": "**Why this shape:**"
   },
   {
    "t": "ul",
    "items": [
     {
      "text": "Hörst's standard is 5×5 weighted pull-ups twice a week, for climbers who can do 10–15 strict pull-ups with no elbow or shoulder history. You qualify. I cut it to 4×4 once a week because you're also climbing three times, and elbows fail from total pulling volume, not from one session."
     },
     {
      "text": "Hörst lists uneven-grip pull-ups and one-arm lock-offs as the route to lock-off strength, and antagonist/stabilizer work as standard injury prevention. That's items 2 and 5."
     },
     {
      "text": "Lattice's assessment data (733 tests) says pull strength keeps mattering up to about 160% of bodyweight for men, and their own coaches say hard climbing maintains it. So this day is support work, not your main lever at V4. Technique mileage on Wednesday is."
     }
    ]
   },
   {
    "t": "p",
    "text": "**Upper-body protection rules.** Any inner-elbow, lower-biceps-tendon, shoulder, or finger-pulley ache at 3/10 or more: (1) drop Friday's climb, (2) drop the lock-off ladder, (3) take the weight off the pull-ups. In that order. Sharp finger pain or a pop: stop climbing and get it looked at."
   }
  ],
  "exercises": [
   {
    "n": null,
    "name": "Warm-up",
    "dose": "8 min",
    "notes": "Band pull-aparts 2×15, scapular pull-ups 2×8, band external rotation 2×12, 2 easy sets of 5 pull-ups"
   },
   {
    "n": 1,
    "name": "Weighted pull-up",
    "dose": "4 × 4",
    "notes": "1 s pause chin-over-bar, controlled lower, shoulders stay engaged at the bottom. 3 min rest. Start with a load you could do 6–7 times (roughly +10–20% bodyweight). +5 lb when all sets are clean. Stop 2 reps short of failure"
   },
   {
    "n": 2,
    "name": "Lock-off ladder",
    "dose": "3 rounds",
    "notes": "One pull: hold 5 s at the top, 5 s at 90°, 5 s at ~120°, lower. 2–3 min rest. From week 3: uneven grip (one hand on a towel 12–18 in lower), 4 rounds, alternate the high hand"
   },
   {
    "n": 3,
    "name": "Single-arm row, neutral grip (cable or dumbbell)",
    "dose": "3 × 8/side",
    "notes": "1 s pause at the ribs"
   },
   {
    "n": 4,
    "name": "Hammer curl",
    "dose": "2 × 8",
    "notes": "3 s lowers. Trains the lock-off muscles (brachialis, brachioradialis); neutral grip is easier on the inner elbow than supinated curls"
   },
   {
    "n": 5,
    "name": "Antagonist circuit",
    "dose": "2–3 rounds",
    "notes": "Push-ups × 12–15, face pulls or band external rotation × 15, light reverse wrist curl × 15"
   },
   {
    "n": 6,
    "name": "Tuck front-lever hold (or hanging knee raise × 8)",
    "dose": "3 × 8–10 s",
    "notes": "Body tension"
   }
  ]
 },
 "CLIMB-H": {
  "id": "CLIMB-H",
  "name": "Climb — Hard",
  "label": "hard climb",
  "when": null,
  "minutes": [
   null,
   90
  ],
  "blocks": [
   {
    "t": "p",
    "text": "20 min warm-up, then ~45 min of attempts at your limit (V4–V5) with 3–5 min rest between tries. End when quality drops. ≤90 min. Legs were trained that morning, so downclimb instead of dropping from the top."
   }
  ],
  "sharedNote": "No hangboard, no campus board during this plan."
 },
 "CLIMB-M": {
  "id": "CLIMB-M",
  "name": "Climb — Medium",
  "label": "medium climb",
  "when": null,
  "minutes": [
   null,
   75
  ],
  "blocks": [
   {
    "t": "p",
    "text": "Flash-level volume (V2–V4). Pick styles you avoid. ≤75 min. Leave with gas in the tank."
   }
  ],
  "sharedNote": "No hangboard, no campus board during this plan."
 },
 "CLIMB-E": {
  "id": "CLIMB-E",
  "name": "Climb — Easy",
  "label": "easy climb",
  "when": null,
  "minutes": [
   null,
   60
  ],
  "blocks": [
   {
    "t": "p",
    "text": "≤60 min, two grades under max, no projects, no dynos. Skip it whenever life gets busy; it's the first thing to cut."
   }
  ],
  "sharedNote": "No hangboard, no campus board during this plan."
 },
 "RESET": {
  "id": "RESET",
  "name": "Active recovery",
  "label": "active recovery",
  "when": "Wednesday, 20–30 min, no equipment",
  "minutes": [
   20,
   30
  ],
  "blocks": [
   {
    "t": "p",
    "text": "10-min easy walk, then: world's-greatest stretch × 5/side, 90/90 hip switches × 10, couch stretch 60 s/side, knee-to-wall ankle mobility × 10/side, thoracic rotations × 8/side, shoulder circles, forearm extensor and flexor stretch 30 s each."
   }
  ]
 },
 "AER": {
  "id": "AER",
  "name": "Low-impact aerobic",
  "label": "low-impact aerobic",
  "when": "Sunday, 30–45 min",
  "minutes": [
   30,
   45
  ],
  "blocks": [
   {
    "t": "p",
    "text": "Bike, elliptical, or incline treadmill walk at conversational effort, then 10 min of the RESET mobility. This adds aerobic work with no pounding on the tibia."
   }
  ]
 },
 "WALK": {
  "id": "WALK",
  "name": "Easy walk only",
  "label": "easy walk only",
  "when": null,
  "minutes": [
   15,
   30
  ],
  "blocks": [
   {
    "t": "p",
    "text": "15–30 min easy walk. That's the whole session."
   }
  ]
 }
};

export const GATES = {
 "title": "Gates (checked every Sunday morning)",
 "blocks": [
  {
   "t": "p",
   "text": "Stay on Track A only if **all** are true for the week just finished:"
  },
  {
   "t": "ol",
   "items": [
    {
     "text": "Saturday's long run was completed nonstop at the planned distance."
    },
    {
     "text": "Shin pain never went above 2/10 during any run."
    },
    {
     "text": "Shin pain the morning after each run was no higher than the morning before it."
    },
    {
     "text": "No run was skipped for shin reasons."
    }
   ]
  },
  {
   "t": "p",
   "text": "Any \"no\" → Track B (section 8). Missing a short weekday run for exams or travel does **not** fail the gate; missing the Saturday long run does."
  }
 ]
};

export const FALLBACK = {
 "title": "Ice and cold fallback (applies to every run)",
 "blocks": [
  {
   "t": "table",
   "head": [
    "Condition",
    "Do this"
   ],
   "rows": [
    [
     "Clear roads, feels-like above 0°F",
     "Run outside as planned"
    ],
    [
     "Ice, unplowed snow, or freezing rain",
     "**Treadmill, 1% incline, same distance, same easy effort.** Counts fully, including milestones"
    ],
    [
     "Feels-like below 0°F",
     "Treadmill, same as above"
    ],
    [
     "No treadmill available",
     "Same number of minutes on bike or elliptical at the same effort. Counts as training, not toward milestones. If it's the long run, move it to Sunday and do Sunday's AER on Saturday"
    ],
    [
     "Dark morning",
     "Reflective vest, headlamp, run facing traffic"
    ]
   ]
  },
  {
   "t": "p",
   "text": "Cold-weather kit: thin gloves, hat or headband, wind-blocking outer layer, and dress for 15–20°F warmer than the thermometer says because you'll heat up."
  }
 ]
};

export const SHIN_RULES = {
 "title": "Shin rules",
 "blocks": [
  {
   "t": "p",
   "text": "Score pain 0–10 at two moments: the **worst point during the run**, and **the next morning** when you first walk and press along the shin."
  },
  {
   "t": "table",
   "head": [
    "Status",
    "What it looks like",
    "What you do"
   ],
   "rows": [
    [
     "**Green**",
     "0–2 during. Gone within an hour. Next morning no worse than the morning before",
     "Continue the plan"
    ],
    [
     "**Yellow**",
     "3–4 during, **or** still there the next morning, **or** creeping up across three runs in a row",
     "Stop the run when it reaches 3 and walk home. Next scheduled run becomes the same minutes on bike or elliptical. No running for 48–72 h. Keep strength work but drop the weight on calf and tibialis exercises to bodyweight. Restart by **repeating the previous week**, which means **Track B**"
    ],
    [
     "**Red**",
     "5 or more, limping, pain when walking, or any item on the doctor list below",
     "No running. Cross-train only if it's pain-free. Book a sports-medicine appointment. Don't run again until daily life has been pain-free for 5 straight days. Restart at less than half your previous weekly mileage"
    ]
   ]
  },
  {
   "t": "p",
   "text": "Two self-checks each Sunday:"
  },
  {
   "t": "ol",
   "items": [
    {
     "text": "**Press test.** Run your thumb down the front and inner edge of the shin bone. Soreness spread along the muscle is the familiar kind. One fingertip-sized tender spot on the bone is not."
    },
    {
     "text": "**Hop test.** 10 single-leg hops per side. Any shin pain is a fail."
    }
   ]
  },
  {
   "t": "p",
   "text": "Where the thresholds come from: Warden, Edwards and Willy (JOSPT 2021) define the right load for a tibial stress injury as one that causes no symptoms during, after, or the next day, and allow a return to running after 5 pain-free days of normal life. The Sanford MTSS guideline restarts running below 50% of prior volume. The looser \"up to 5/10 is acceptable\" pain-monitoring model (Thomeé, Silbernagel) was built for tendons, not bone, so it is not used here."
  }
 ]
};

export const DOCTOR_LIST = {
 "title": "See a doctor if any of these show up",
 "items": [
  "One spot on the shin bone, small enough to cover with a fingertip, that hurts when pressed",
  "Pain at rest, at night, or when walking",
  "Pain on the hop test",
  "Swelling, warmth, or a lump over the shin",
  "No improvement after 1–2 weeks of backing off",
  "**Compartment-syndrome pattern:** tightness, cramping or burning in the front or outside of the shin that starts at about the same point in every run, builds as you continue, and eases within about 15 minutes of stopping. Especially with numbness or tingling on the top of the foot, or the foot slapping the ground",
  "**Go to the ER** for a tense, swollen lower leg with severe pain that doesn't settle with rest, or numbness that doesn't clear"
 ]
};

export const TRACK_B = {
 "title": "Track B — the backup timeline",
 "blocks": [
  {
   "t": "p",
   "text": "**Trigger:** any failed gate in section 4."
  },
  {
   "t": "p",
   "text": "**Rules (the site computes this; here is the logic):**"
  },
  {
   "t": "ol",
   "items": [
    {
     "text": "The Saturday after the trigger, repeat the **longest long run you completed green in the last 3 weeks**, rounded down to a whole mile. After a red, start at half of it."
    },
    {
     "text": "Each Saturday after that adds **1 mile at most**, and never goes past 8.5 before the attempt."
    },
    {
     "text": "Every **4th** week after the switch is a cutback: long run 25% shorter than the week before, rounded to the nearest half mile. The week after a cutback resumes at the pre-cutback distance plus 1."
    },
    {
     "text": "Two weekday runs, each about 40–45% of that week's long run, rounded to the nearest half mile, minimum 2, maximum 4."
    },
    {
     "text": "After a clean **8.5**, the next Saturday is 6, and the Saturday after that is **10**."
    },
    {
     "text": "Strength, pull day, climbing, and recovery days stay exactly as in section 3."
    },
    {
     "text": "Finals and holiday adjustments from section 4 still apply on their dates."
    }
   ]
  },
  {
   "t": "p",
   "text": "**Worked example — trigger in week 2 (yellow on Nov 21):**"
  },
  {
   "t": "table",
   "head": [
    "Sat",
    "Long run",
    "Note"
   ],
   "rows": [
    [
     "Nov 28",
     "4",
     "Repeat last green distance"
    ],
    [
     "Dec 5",
     "5",
     ""
    ],
    [
     "Dec 12",
     "6",
     "Finals week: weekday runs trimmed, long run holds"
    ],
    [
     "Dec 19",
     "4.5",
     "Cutback (4th week)"
    ],
    [
     "Dec 26",
     "7",
     ""
    ],
    [
     "Jan 2",
     "8",
     ""
    ],
    [
     "Jan 9",
     "8.5",
     ""
    ],
    [
     "Jan 16",
     "6",
     ""
    ],
    [
     "**Jan 23**",
     "**10**",
     ""
    ]
   ]
  },
  {
   "t": "p",
   "text": "On this example you'd finish 2026 with a longest run of 7 miles, which is more than double where you started. A December trigger lands on about the same date, because less has to be rebuilt."
  },
  {
   "t": "p",
   "text": "**Hard cap:** if the 10-miler isn't done by Sat Jan 30, stop chasing the date, see a professional about the shin, and rebuild from a clean base."
  }
 ]
};

export const ATTEMPT_DAY = {
 "title": "Dec 31 — attempt day",
 "blocks": [
  {
   "t": "ul",
   "items": [
    {
     "text": "**Sun Dec 27:** check the forecast. Dry roads Thursday → go Thursday morning. Ice or deep cold Thursday → either run it Tuesday Dec 29 after work on clear roads, or do all 10 on the treadmill Thursday. A treadmill 10 counts."
    },
    {
     "text": "**Route:** flat, plowed, two or three loops past your car or house so water and a bail-out are never more than a couple of miles away."
    },
    {
     "text": "**Morning:** eat what you ate before the 8.5 on Dec 19, 2–3 hours ahead. 10-min walk warm-up."
    },
    {
     "text": "**Pacing:** miles 1–2 slower than your easy pace. Miles 3–8 at easy pace. Miles 9–10 are whatever you have. Expect roughly 1:40–1:55 total."
    },
    {
     "text": "**Fuel:** carbs at ~45 and ~75 minutes, water each loop."
    },
    {
     "text": "**Shin rule still applies.** A 3/10 at mile 6 means walk in and run it in January. It will still be there."
    }
   ]
  }
 ]
};

export const BENCHMARKS = [
 {
  "id": "talk2",
  "name": "Talk-test 2-mile",
  "how": "Same flat route, full-sentences effort, record the time",
  "dates": [
   "2026-11-12",
   "2026-12-03",
   "2026-12-24"
  ],
  "datesText": "Nov 12, Dec 3, Dec 24",
  "target": "Faster at the same effort"
 },
 {
  "id": "longest",
  "name": "Longest nonstop run",
  "how": "From the log",
  "dates": [],
  "datesText": "Every Saturday",
  "target": "10.0"
 },
 {
  "id": "calf",
  "name": "Single-leg calf raise",
  "how": "Max reps per side, full range, 1 rep per 2 s",
  "dates": [
   "2026-11-16",
   "2026-12-21"
  ],
  "datesText": "Nov 16, Dec 21",
  "target": "25 per side"
 },
 {
  "id": "pullup",
  "name": "Weighted pull-up",
  "how": "Heaviest clean set of 4",
  "dates": [
   "2026-11-13",
   "2026-12-18"
  ],
  "datesText": "Nov 13, Dec 18",
  "target": "+10 lb or more over baseline"
 },
 {
  "id": "lockoff",
  "name": "One-arm lock-off",
  "how": "Seconds held, chin over bar, per side (use the other hand on your wrist if 0 s)",
  "dates": [
   "2026-11-13",
   "2026-12-18"
  ],
  "datesText": "Nov 13, Dec 18",
  "target": "5 s per side"
 }
];

export const MILESTONES = [
 {
  "id": "m4",
  "kind": "nonstop",
  "miles": 4,
  "name": "First 4-miler",
  "date": "2026-11-14",
  "by": false
 },
 {
  "id": "m5",
  "kind": "nonstop",
  "miles": 5,
  "name": "First 5-miler",
  "date": "2026-11-21",
  "by": false
 },
 {
  "id": "week10",
  "kind": "week",
  "miles": 10,
  "name": "First 10-mile week",
  "date": "2026-11-21",
  "by": false
 },
 {
  "id": "m10k",
  "kind": "nonstop",
  "miles": 6.2,
  "name": "First 10K",
  "date": "2026-11-28",
  "by": false
 },
 {
  "id": "total25",
  "kind": "total",
  "miles": 25,
  "name": "25 total miles",
  "date": "2026-11-28",
  "by": false
 },
 {
  "id": "m7",
  "kind": "nonstop",
  "miles": 7,
  "name": "First run over an hour / 7 miles",
  "date": "2026-12-05",
  "by": false
 },
 {
  "id": "total50",
  "kind": "total",
  "miles": 50,
  "name": "50 total miles",
  "date": "2026-12-12",
  "by": false
 },
 {
  "id": "m8_5",
  "kind": "nonstop",
  "miles": 8.5,
  "name": "8.5 miles",
  "date": "2026-12-19",
  "by": false
 },
 {
  "id": "total75",
  "kind": "total",
  "miles": 75,
  "name": "75 total miles",
  "date": "2026-12-24",
  "by": false
 },
 {
  "id": "green4",
  "kind": "greenWeeks",
  "weeks": 4,
  "name": "Four straight green weeks",
  "date": "2026-12-06",
  "by": false
 },
 {
  "id": "calf25",
  "kind": "benchmark",
  "benchmark": "calf",
  "value": 25,
  "name": "25 single-leg calf raises per side",
  "date": "2026-12-21",
  "by": true
 },
 {
  "id": "lockoff5",
  "kind": "benchmark",
  "benchmark": "lockoff",
  "value": 5,
  "name": "5-second one-arm lock-off",
  "date": "2026-12-18",
  "by": true
 },
 {
  "id": "m10",
  "kind": "nonstop",
  "miles": 10,
  "name": "10 miles nonstop",
  "date": "2026-12-31",
  "by": false
 }
];

export const LOG_FIELDS = [
 "Run: date, distance, time (pace is calculated), nonstop yes/no, surface (road / treadmill / cross-train), effort 1–10, shin during 0–10, notes.",
 "Next morning: shin 0–10.",
 "Strength: session done, plus weight × reps for trap-bar deadlift, split squat, single-leg calf raise, weighted pull-up, and lock-off round count.",
 "Climb: done, hard/medium/easy, elbow or finger ache 0–10 (optional)."
];

export const SOURCES = [
 {
  "title": "Running progression",
  "links": [
   {
    "label": "Nielsen et al., \"Excessive progression in weekly running distance and risk of running-related injuries,\" JOSPT 2014",
    "url": "https://vbn.aau.dk/da/publications/excessive-progression-in-weekly-running-distance-and-risk-of-runn"
   },
   {
    "label": "Jack Daniels' long-run cap, as summarized by Outside",
    "url": "https://www.outsideonline.com/health/running/training-advice/running-101/mastering-the-long-run/"
   },
   {
    "label": "Hal Higdon novice programs (Human Kinetics excerpt)",
    "url": "https://us.humankinetics.com/blogs/excerpt/novice-training-programs"
   },
   {
    "label": "Hal Higdon 10-Mile Novice",
    "url": "https://www.trainingpeaks.com/training-plans/running/trail/tp-4379/hal-higdon-10-mile-novice"
   },
   {
    "label": "Galloway run-walk-run overview",
    "url": "https://runnersconnect.net/galloway-run-walk-run/"
   }
  ]
 },
 {
  "title": "Strength for runners",
  "links": [
   {
    "label": "Blagrove, Howatson, Hayes, Sports Medicine 2018",
    "url": "https://pubmed.ncbi.nlm.nih.gov/29249083/"
   },
   {
    "label": "Eihara et al., Sports Medicine – Open 2022",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9653533/"
   }
  ]
 },
 {
  "title": "Shin and bone-stress injury",
  "links": [
   {
    "label": "Warden, Edwards, Willy, \"Optimal load for managing low-risk tibial and metatarsal bone stress injuries in runners,\" JOSPT 2021",
    "url": "https://scholarworks.indianapolis.iu.edu/items/0315cf2c-647a-4e9b-9933-651656a73272"
   },
   {
    "label": "Warden, Davis, Fredericson, \"Management and prevention of bone stress injuries in long-distance runners,\" JOSPT 2014",
    "url": "https://pubmed.ncbi.nlm.nih.gov/25103133/"
   },
   {
    "label": "Sanford Health MTSS rehabilitation guideline",
    "url": "https://www.sanfordhealth.org/-/media/org/files/medical-professionals/resources-and-education/medial-tibial-stress-syndrome-guideline.pdf"
   },
   {
    "label": "Saint Louis University tibial stress fracture / MTSS protocol (anterior tibia as high-risk site)",
    "url": "https://chemistry.slu.edu/medicine/orthopaedic-surgery/sports-medicine/-pdf/mtss-guidelines.pdf"
   },
   {
    "label": "Mayo Clinic, chronic exertional compartment syndrome",
    "url": "https://www.mayoclinic.org/diseases-conditions/chronic-exertional-compartment-syndrome/symptoms-causes/syc-20350830"
   },
   {
    "label": "Heiderscheit et al., \"Effects of step rate manipulation on joint mechanics during running,\" MSSE 2011",
    "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3022995"
   },
   {
    "label": "Pain-monitoring model and why it doesn't apply to bone",
    "url": "https://runnersconnect.net/running-injury-prevention/returning-from-running-injury/"
   }
  ]
 },
 {
  "title": "Climbing",
  "links": [
   {
    "label": "Eric Hörst, \"5×5 weighted pull-up training\"",
    "url": "https://trainingforclimbing.com/?p=9655"
   },
   {
    "label": "Eric Hörst, hypergravity pull-up training (who should do weighted pull-ups)",
    "url": "https://trainingforclimbing.com/hypergravity-pull-up-training-for-increased-strength-power-and-endurance/"
   },
   {
    "label": "Eric Hörst, uneven-grip pull-ups and lock-offs",
    "url": "https://nicros.com/?p=1673"
   },
   {
    "label": "Lattice Training, \"Pull-ups: diminishing returns\"",
    "url": "https://latticetraining.com/blog/pull-ups-dimishing-returns"
   },
   {
    "label": "Lattice Training, how to train for bouldering (BMC)",
    "url": "https://thebmc.co.uk/en/how-to-train-for-bouldering"
   }
  ]
 }
];
