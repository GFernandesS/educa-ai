import { SchoolMatter } from "src/enums/school-matter";

export interface StudentCommentDto {
    id: string,
    comment: string,
    matter: SchoolMatter
}