import { demoProjects } from "../../../prisma/demo-data";
const fixedIds=new Set(["oura-us","whoop-us","ultrahuman-in"]);
export const evaluationCases=demoProjects.filter(project=>fixedIds.has(project.id)).map(project=>({projectName:project.name,research:project.research,insights:project.insights,brief:project.brief}));
