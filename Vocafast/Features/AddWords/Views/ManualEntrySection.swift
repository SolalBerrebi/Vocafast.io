import SwiftUI

struct ManualEntrySection: View {
    @ObservedObject var viewModel: AddWordsViewModel

    var body: some View {
        VStack(spacing: 16) {
            // Description
            Text("Add a single word with its translation. Use this when you encounter a new word you want to remember.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.callout)
                    .foregroundStyle(.red)
                    .padding(.horizontal, 16)
            }

            VStack(spacing: 12) {
                TextField("Word (target language)", text: $viewModel.manualWord)
                    .textFieldStyle(.roundedBorder)

                TextField("Translation (native language)", text: $viewModel.manualTranslation)
                    .textFieldStyle(.roundedBorder)

                TextField("Context sentence (optional)", text: $viewModel.manualContext)
                    .textFieldStyle(.roundedBorder)
            }
            .padding(.horizontal, 16)

            Button {
                Task { await viewModel.addManualWord() }
            } label: {
                Group {
                    if viewModel.isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Add Word")
                    }
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .foregroundStyle(.white)
                .background(Color.accentColor)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(viewModel.isLoading)
            .padding(.horizontal, 16)
        }
    }
}
