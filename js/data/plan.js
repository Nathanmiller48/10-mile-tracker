// GENERATED from PLAN.md section 4 by scripts/build-plan.mjs. Do not edit by hand.
// To change the plan: edit PLAN.md (with Nate's say-so), then run: node scripts/build-plan.mjs

export const PLAN_START = "2026-11-12";
export const PLAN_END = "2026-12-31";
export const PLAN_WEEKS = 8;

/**
 * One entry per plan day, in date order.
 * morning: { sessions: session ids, modifier: 'lite' | 'light' | null }
 * evening: { session, optional } or null for nothing planned
 * benchmarks: [{ id: 'talk2' | 'pullup' | 'lockoff' | 'calf', round }]
 */
export const PLAN_DAYS = [
  {"date":"2026-11-12","dow":"Thu","week":1,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":2,"evening":null,"notes":"Benchmark: talk-test 2-mile #1. Count cadence. Legs may still be sore; keep it truly easy.","benchmarks":[{"id":"talk2","round":1}],"milestones":[],"attempt":false},
  {"date":"2026-11-13","dow":"Fri","week":1,"morning":{"sessions":["PULL"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-E","optional":false},"notes":"Intro pull day: 3 sets, find your weights. Benchmark: weighted pull-up + lock-off #1.","benchmarks":[{"id":"pullup","round":1},{"id":"lockoff","round":1}],"milestones":[],"attempt":false},
  {"date":"2026-11-14","dow":"Sat","week":1,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":4,"evening":null,"notes":"Capped at 4. Milestone: first 4-miler.","benchmarks":[],"milestones":["first 4-miler"],"attempt":false},
  {"date":"2026-11-15","dow":"Sun","week":1,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":null,"notes":"30–40 min.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-16","dow":"Mon","week":2,"morning":{"sessions":["STR-A"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-H","optional":false},"notes":"Benchmark: single-leg calf raise #1. 2 sets per lift this week.","benchmarks":[{"id":"calf","round":1}],"milestones":[],"attempt":false},
  {"date":"2026-11-17","dow":"Tue","week":2,"morning":{"sessions":["RUN-E"],"modifier":null},"runMiles":2.5,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-18","dow":"Wed","week":2,"morning":{"sessions":["RESET"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-M","optional":false},"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-19","dow":"Thu","week":2,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":2.5,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-20","dow":"Fri","week":2,"morning":{"sessions":["PULL"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-E","optional":false},"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-21","dow":"Sat","week":2,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":5,"evening":null,"notes":"Milestone: first 5-miler. First 10-mile week.","benchmarks":[],"milestones":["first 5-miler","First 10-mile week"],"attempt":false},
  {"date":"2026-11-22","dow":"Sun","week":2,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-23","dow":"Mon","week":3,"morning":{"sessions":["STR-A"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-H","optional":false},"notes":"3 sets from here.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-24","dow":"Tue","week":3,"morning":{"sessions":["RUN-E"],"modifier":null},"runMiles":3,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-25","dow":"Wed","week":3,"morning":{"sessions":["RESET"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-M","optional":false},"notes":"Check gym holiday hours.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-26","dow":"Thu","week":3,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":3,"evening":null,"notes":"Thanksgiving. Solo turkey trot before the meal.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-27","dow":"Fri","week":3,"morning":{"sessions":["PULL"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-E","optional":false},"notes":"Uneven-grip lock-offs start.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-28","dow":"Sat","week":3,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":6.2,"evening":null,"notes":"Milestone: first 10K.","benchmarks":[],"milestones":["first 10K"],"attempt":false},
  {"date":"2026-11-29","dow":"Sun","week":3,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-11-30","dow":"Mon","week":4,"morning":{"sessions":["STR-A"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-H","optional":false},"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-01","dow":"Tue","week":4,"morning":{"sessions":["RUN-E"],"modifier":null},"runMiles":3,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-02","dow":"Wed","week":4,"morning":{"sessions":["RESET"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-M","optional":false},"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-03","dow":"Thu","week":4,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":3.5,"evening":null,"notes":"Benchmark: talk-test 2-mile #2 (first 2 miles of the run). Add 4 strides if shins have been green for 2 weeks.","benchmarks":[{"id":"talk2","round":2}],"milestones":[],"attempt":false},
  {"date":"2026-12-04","dow":"Fri","week":4,"morning":{"sessions":["PULL"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-E","optional":false},"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-05","dow":"Sat","week":4,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":7,"evening":null,"notes":"Milestone: 7 miles, first run over an hour.","benchmarks":[],"milestones":["7 miles, first run over an hour"],"attempt":false},
  {"date":"2026-12-06","dow":"Sun","week":4,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-07","dow":"Mon","week":5,"morning":{"sessions":["STR-A"],"modifier":"lite"},"runMiles":0,"evening":{"session":"CLIMB-M","optional":true},"notes":"Finals week, cutback. 2 sets, 35 min. No limit bouldering this week. Online exam Dec 7–8.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-08","dow":"Tue","week":5,"morning":{"sessions":["RUN-E"],"modifier":null},"runMiles":3,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-09","dow":"Wed","week":5,"morning":{"sessions":["RESET"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-M","optional":true},"notes":"Exam today. 20 min is enough.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-10","dow":"Thu","week":5,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":3,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-11","dow":"Fri","week":5,"morning":{"sessions":["PULL"],"modifier":"lite"},"runMiles":0,"evening":{"session":"CLIMB-E","optional":true},"notes":"Same weight, 3×3, skip the ladder.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-12","dow":"Sat","week":5,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":5,"evening":null,"notes":"Cutback long run. Milestone: 50 total miles.","benchmarks":[],"milestones":["50 total miles"],"attempt":false},
  {"date":"2026-12-13","dow":"Sun","week":5,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":null,"notes":"30 min walk, then study.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-14","dow":"Mon","week":6,"morning":{"sessions":["WALK"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-E","optional":true},"notes":"MKT 313 final 7:45am + second exam. 15–20 min walk only. No lifting.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-15","dow":"Tue","week":6,"morning":{"sessions":["RUN-E"],"modifier":null},"runMiles":3.5,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-16","dow":"Wed","week":6,"morning":{"sessions":["RESET"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-H","optional":false},"notes":"Lab due. Hard climb moves here this week.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-17","dow":"Thu","week":6,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":3.5,"evening":null,"notes":"Final meeting. Strides if green. No heavy legs this week; they stay fresh for Saturday.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-18","dow":"Fri","week":6,"morning":{"sessions":["PULL"],"modifier":null},"runMiles":0,"evening":null,"notes":"Benchmark: weighted pull-up + lock-off #2. No evening climb before the biggest long run.","benchmarks":[{"id":"pullup","round":2},{"id":"lockoff","round":2}],"milestones":[],"attempt":false},
  {"date":"2026-12-19","dow":"Sat","week":6,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":8.5,"evening":null,"notes":"Dress rehearsal: same shoes, kit, breakfast and fuel you'll use Dec 31. Milestone: 8.5 miles.","benchmarks":[],"milestones":["8.5 miles"],"attempt":false},
  {"date":"2026-12-20","dow":"Sun","week":6,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-21","dow":"Mon","week":7,"morning":{"sessions":["STR-A"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-H","optional":false},"notes":"Last heavy leg day. 2 sets. Benchmark: single-leg calf raise #2.","benchmarks":[{"id":"calf","round":2}],"milestones":[],"attempt":false},
  {"date":"2026-12-22","dow":"Tue","week":7,"morning":{"sessions":["RUN-E"],"modifier":null},"runMiles":4,"evening":null,"notes":"","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-23","dow":"Wed","week":7,"morning":{"sessions":["PULL"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-E","optional":false},"notes":"Pull day moves up; gyms close for Christmas.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-24","dow":"Thu","week":7,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":null},"runMiles":3,"evening":null,"notes":"Benchmark: talk-test 2-mile #3.","benchmarks":[{"id":"talk2","round":3}],"milestones":[],"attempt":false},
  {"date":"2026-12-25","dow":"Fri","week":7,"morning":{"sessions":["WALK"],"modifier":null},"runMiles":0,"evening":null,"notes":"Christmas. 30-min walk.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-26","dow":"Sat","week":7,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":6,"evening":null,"notes":"Relaxed. Nothing to prove today.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-27","dow":"Sun","week":7,"morning":{"sessions":["AER"],"modifier":null},"runMiles":0,"evening":{"session":"CLIMB-M","optional":true},"notes":"Check the Dec 31 forecast and decide the attempt day (section 9).","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-28","dow":"Mon","week":8,"morning":{"sessions":["RUN-E","ARM-B"],"modifier":"light"},"runMiles":2,"evening":{"session":"CLIMB-E","optional":false},"notes":"4 strides. No heavy calves. Short climb, last one before the attempt.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-29","dow":"Tue","week":8,"morning":{"sessions":["RESET"],"modifier":null},"runMiles":0,"evening":null,"notes":"Backup attempt slot after work if Thursday looks icy.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-30","dow":"Wed","week":8,"morning":{"sessions":["WALK"],"modifier":null},"runMiles":0,"evening":null,"notes":"15–20 min. Lay out kit. Normal dinner with extra carbs. Sleep.","benchmarks":[],"milestones":[],"attempt":false},
  {"date":"2026-12-31","dow":"Thu","week":8,"morning":{"sessions":["RUN-L"],"modifier":null},"runMiles":10,"evening":null,"notes":"10 MILES NONSTOP.","benchmarks":[],"milestones":[],"attempt":true},
];
