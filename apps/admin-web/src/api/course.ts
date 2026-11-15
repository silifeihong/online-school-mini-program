import request from '@/utils/request';

// ---------- 类型 ----------

/** draft=草稿（从未发布）、on=已上架、off=已下架（发布过后下架） */
export type CourseStatus = 'draft' | 'on' | 'off';
export type PaymentType = 'paid' | 'free';
export type ChapterContentType = 'video' | 'document';

export interface Course {
  id: number;
  title: string;
  cover_url: string | null;
  subtitle: string | null;
  teacher: string | null;
  description: string | null;
  payment_type: PaymentType;
  price: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  chapter_count?: number;
  student_count?: number;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  content_type: ChapterContentType;
  file_url: string | null;
  is_trial: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CourseDetail extends Course {
  chapters: Chapter[];
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  payment_type?: PaymentType;
  status?: CourseStatus;
}

export interface CreateCourseParams {
  title: string;
  cover_url?: string | null;
  subtitle?: string;
  teacher?: string;
  description?: string;
  payment_type: PaymentType;
  price: number;
}

export type UpdateCourseParams = Partial<CreateCourseParams>;

export interface CreateChapterParams {
  title: string;
  description?: string;
  content_type?: ChapterContentType;
  file_url?: string;
  is_trial?: boolean;
  sort_order?: number;
}

export type UpdateChapterParams = Partial<CreateChapterParams>;

export interface ListResponse<T> {
  list: T[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface EnrolledStudent {
  enrollment_id: number;
  user_id: number;
  openid_masked: string;
  nickname: string;
  email: string;
  grade: string | null;
  major: string | null;
  university: string | null;
  joined_at: string;
}

export interface CandidateStudent {
  user_id: number;
  openid_masked: string;
  nickname: string;
  email: string;
  grade: string | null;
  major: string | null;
  university: string | null;
  enrolled: boolean;
}

// ---------- 课程 ----------

export function getCourseList(params: CourseListParams): Promise<ListResponse<Course>> {
  return request.get('/admin/courses', { params });
}

export function createCourse(data: CreateCourseParams): Promise<Course> {
  return request.post('/admin/courses', data);
}

export function getCourseDetail(id: number): Promise<CourseDetail> {
  return request.get(`/admin/courses/${id}`);
}

export function updateCourse(id: number, data: UpdateCourseParams): Promise<Course> {
  return request.put(`/admin/courses/${id}`, data);
}

export function deleteCourse(id: number): Promise<null> {
  return request.delete(`/admin/courses/${id}`);
}

export function updateCourseStatus(id: number, status: CourseStatus): Promise<Course> {
  return request.put(`/admin/courses/${id}/status`, { status });
}

export function publishCourse(id: number): Promise<Course> {
  return request.post(`/admin/courses/${id}/publish`);
}

// ---------- 章节 ----------

export function getChapterList(courseId: number): Promise<Chapter[]> {
  return request.get(`/admin/courses/${courseId}/chapters`);
}

export function createChapter(courseId: number, data: CreateChapterParams): Promise<Chapter> {
  return request.post(`/admin/courses/${courseId}/chapters`, data);
}

export function updateChapter(
  courseId: number,
  chapterId: number,
  data: UpdateChapterParams,
): Promise<Chapter> {
  return request.put(`/admin/courses/${courseId}/chapters/${chapterId}`, data);
}

export function deleteChapter(courseId: number, chapterId: number): Promise<null> {
  return request.delete(`/admin/courses/${courseId}/chapters/${chapterId}`);
}

export function sortChapters(courseId: number, ids: number[]): Promise<null> {
  return request.put(`/admin/courses/${courseId}/chapters/sort`, { ids });
}

// ---------- 课程学员 ----------

export function getCourseStudents(
  courseId: number,
  params: { page?: number; limit?: number; keyword?: string },
): Promise<ListResponse<EnrolledStudent>> {
  return request.get(`/admin/courses/${courseId}/students`, { params });
}

export function getStudentCandidates(
  courseId: number,
  params: {
    page?: number;
    limit?: number;
    keyword?: string;
    email?: string;
    grade?: string;
    major?: string;
    university?: string;
  },
): Promise<ListResponse<CandidateStudent>> {
  return request.get(`/admin/courses/${courseId}/students/candidates`, { params });
}

export function batchAddStudents(courseId: number, userIds: number[]): Promise<{ added: number }> {
  return request.post(`/admin/courses/${courseId}/students/batch`, { user_ids: userIds });
}

export function removeCourseStudent(courseId: number, userId: number): Promise<null> {
  return request.delete(`/admin/courses/${courseId}/students/${userId}`);
}
