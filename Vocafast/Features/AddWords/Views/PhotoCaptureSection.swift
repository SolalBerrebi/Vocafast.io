import SwiftUI

struct PhotoCaptureSection: View {
    @ObservedObject var viewModel: AddWordsViewModel

    private let useCases: [(icon: String, label: String)] = [
        ("fork.knife", "Restaurant menus"),
        ("signpost.right.fill", "Street signs"),
        ("book.fill", "Textbook pages"),
        ("tag.fill", "Product labels"),
        ("newspaper.fill", "Newspapers"),
        ("map.fill", "Maps & guides"),
    ]

    var body: some View {
        VStack(spacing: 16) {
            if viewModel.extractedWords.isEmpty && viewModel.selectedImage == nil {
                // Description
                VStack(alignment: .leading, spacing: 12) {
                    Text("Point your camera at real-world text and AI will find the words worth learning.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    // Use case grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                        ForEach(useCases, id: \.label) { item in
                            HStack(spacing: 8) {
                                Image(systemName: item.icon)
                                    .font(.caption)
                                    .foregroundStyle(.orange)
                                    .frame(width: 16)
                                Text(item.label)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Spacer()
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)

                // Camera/Gallery buttons
                HStack(spacing: 16) {
                    Button {
                        viewModel.showCamera = true
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                                .font(.title2)
                            Text("Take Photo")
                                .font(.subheadline.weight(.medium))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 100)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .foregroundStyle(.primary)

                    Button {
                        viewModel.showGallery = true
                    } label: {
                        VStack(spacing: 8) {
                            Image(systemName: "photo.on.rectangle")
                                .font(.title2)
                            Text("Gallery")
                                .font(.subheadline.weight(.medium))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 100)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .foregroundStyle(.primary)
                }
                .padding(.horizontal, 16)
            }

            // Loading state
            if viewModel.isLoading {
                VStack(spacing: 12) {
                    ProgressView()
                    Text(viewModel.loadingMessage)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 24)
            }

            // Error
            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.callout)
                    .foregroundStyle(.red)
                    .padding(.horizontal, 16)
            }

            // Preview image
            if let image = viewModel.selectedImage, !viewModel.isLoading {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 200)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 16)
            }

            // Extracted words
            if !viewModel.extractedWords.isEmpty {
                WordReviewList(
                    words: $viewModel.extractedWords,
                    onToggle: viewModel.toggleWordSelection
                )

                HStack(spacing: 12) {
                    Button("Retake") {
                        viewModel.clearExtracted()
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color(.systemGray5))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    Button {
                        Task { await viewModel.saveSelected(sourceType: .photo) }
                    } label: {
                        Text("Save Selected")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .frame(height: 44)
                            .foregroundStyle(.white)
                            .background(Color.accentColor)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(.horizontal, 16)
            }
        }
        .sheet(isPresented: $viewModel.showCamera) {
            ImagePicker(sourceType: .camera) { image in
                Task { await viewModel.processImage(image) }
            }
        }
        .sheet(isPresented: $viewModel.showGallery) {
            ImagePicker(sourceType: .photoLibrary) { image in
                Task { await viewModel.processImage(image) }
            }
        }
    }
}
