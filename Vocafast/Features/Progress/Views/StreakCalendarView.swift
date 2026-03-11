import SwiftUI

struct StreakCalendarView: View {
    let sessionDates: Set<String>

    private let columns = 7
    private let rows = 15
    private let cellSize: CGFloat = 15
    private let spacing: CGFloat = 3

    private var calendar: Calendar { Calendar.current }

    private var cells: [CellData] {
        let today = Date()
        let totalDays = columns * rows
        var result: [CellData] = []

        for i in stride(from: totalDays - 1, through: 0, by: -1) {
            guard let date = calendar.date(byAdding: .day, value: -i, to: today) else { continue }
            let dateStr = date.yyyyMMdd
            let hasActivity = sessionDates.contains(dateStr)
            let isToday = i == 0
            result.append(CellData(date: dateStr, hasActivity: hasActivity, isToday: isToday))
        }

        return result
    }

    private var currentStreak: Int {
        let today = Date()
        var streak = 0
        for i in 0... {
            guard let date = calendar.date(byAdding: .day, value: -i, to: today) else { break }
            if sessionDates.contains(date.yyyyMMdd) {
                streak += 1
            } else if i > 0 {
                break
            }
        }
        return streak
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                ScrollViewReader { proxy in
                    LazyHGrid(
                        rows: Array(repeating: GridItem(.fixed(cellSize), spacing: spacing), count: columns),
                        spacing: spacing
                    ) {
                        ForEach(Array(cells.enumerated()), id: \.element.date) { index, cell in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(cellColor(for: cell))
                                .frame(width: cellSize, height: cellSize)
                                .overlay(
                                    cell.isToday ?
                                    RoundedRectangle(cornerRadius: 3)
                                        .stroke(Color.green, lineWidth: 1.5)
                                    : nil
                                )
                                .id(index)
                        }
                    }
                    .onAppear {
                        proxy.scrollTo(cells.count - 1, anchor: .trailing)
                    }
                }
            }
            .frame(height: CGFloat(columns) * (cellSize + spacing))

            // Legend
            HStack(spacing: 12) {
                Text("\(sessionDates.count) active days")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                Spacer()

                HStack(spacing: 4) {
                    Text("Less")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemGray5))
                        .frame(width: 10, height: 10)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.green.opacity(0.4))
                        .frame(width: 10, height: 10)

                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.green)
                        .frame(width: 10, height: 10)

                    Text("More")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func cellColor(for cell: CellData) -> Color {
        if cell.hasActivity {
            return Color.green
        } else {
            return Color(.systemGray5)
        }
    }
}

private struct CellData: Hashable {
    let date: String
    let hasActivity: Bool
    let isToday: Bool
}
