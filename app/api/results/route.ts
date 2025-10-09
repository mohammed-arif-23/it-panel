import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '../../../lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentRegNo = searchParams.get('register_number')
    
    console.log('🔍 Results API: register_number param:', studentRegNo)

    if (!studentRegNo) {
      return NextResponse.json(
        { error: 'Student register number is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const resultsCollection = db.collection('semester_result_sheets')

    // Find all result documents that contain the student's register number
    const allResults = await resultsCollection
      .find({
        'result_data.stu_reg_no': studentRegNo
      })
      .sort({ 'last_updated': -1 })
      .toArray()

    console.log('🔍 Results API: MongoDB results count:', allResults.length)

    // Extract student-specific results from each document
    const studentResults = allResults.map(resultDoc => {
      const studentData = resultDoc.result_data.find(
        (student: any) => student.stu_reg_no === studentRegNo
      )

      if (!studentData) return null

      return {
        _id: resultDoc._id,
        sheet_id: resultDoc.sheet_id,
        department: resultDoc.department,
        year: resultDoc.year,
        year_num: resultDoc.year_num,
        semester: resultDoc.semester,
        batch: resultDoc.batch,
        exam_cycle: resultDoc.exam_cycle,
        last_updated: resultDoc.last_updated,
        student_data: {
          stu_reg_no: studentData.stu_reg_no,
          stu_name: studentData.stu_name,
          res_data: studentData.res_data
        }
      }
    }).filter(Boolean) // Remove null entries

    if (studentResults.length === 0) {
      return NextResponse.json(
        { 
          message: 'No results found for this student',
          results: []
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      message: 'Results fetched successfully',
      results: studentResults,
      total_semesters: studentResults.length
    })

  } catch (error) {
    console.error('Error fetching results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
