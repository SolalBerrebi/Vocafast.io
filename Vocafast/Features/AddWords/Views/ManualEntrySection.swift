import SwiftUI

struct ManualEntrySection: View {
    @ObservedObject var viewModel: AddWordsViewModel

    var body: some View {
        VStack(spacing: 16) {
            // Description
            Text(L("manual_desc"))
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
                TextField(L("manual_word"), text: $viewModel.manualWord)
                    .textFieldStyle(.roundedBorder)

                TextField(L("manual_translation"), text: $viewModel.manualTranslation)
                    .textFieldStyle(.roundedBorder)

                TextField(L("manual_context"), text: $viewModel.manualContext)
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
                        Text(L("manual_add_word"))
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
