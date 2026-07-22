import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function requireOwnedProject(request:Request,id:string){
  const user=await requireUser(request);
  const project=await prisma.project.findFirst({where:{id,ownerId:user.userId}});
  return{...user,project};
}
