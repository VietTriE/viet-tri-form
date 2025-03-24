<script lang="ts">
	import type { PageData } from './$types.js';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import CirclePlus from 'lucide-svelte/icons/circle-plus';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Image from 'lucide-svelte/icons/image';
	import X from 'lucide-svelte/icons/x';
	import Pilcrow from 'lucide-svelte/icons/pilcrow';
	import Heading1 from 'lucide-svelte/icons/heading-1';
	import Heading2 from 'lucide-svelte/icons/heading-2';
	import List from 'lucide-svelte/icons/list';
	import Space from 'lucide-svelte/icons/space';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { writable } from 'svelte/store';
	import type { Post, Section } from '$lib/types.js';
	import Loader from 'lucide-svelte/icons/loader';

	export let data: PageData;

	let dialogOpen = false;
	let currentPostType: 'news' | 'services' | 'aboutUs' | 'projects' = 'news';
	let inputSectionImage: HTMLInputElement;
	let inputImage: HTMLInputElement;
	let thumbnailList: Record<string, { url: string; state: string }> = {};
	let showSectionDropdown = false;
	let sections: Section[] = [];
	let isPosting = false;
	let activeTab: 'news' | 'services' | 'aboutUs' | 'projects' = 'news';
	let insertAtIndex = -1;

	const sectionTypes = [
		{ type: 'paragraph', label: 'Đoạn văn' },
		{ type: 'header', label: 'Tiêu đề lớn' },
		{ type: 'subheader', label: 'Tiêu đề nhỏ' },
		{ type: 'bulletList', label: 'Danh sách' },
		{ type: 'image', label: 'Hình ảnh' },
		{ type: 'space', label: 'Khoảng trống' }
	] as const;

	const typePrefix = {
		news: 'VTEN',
		services: 'VTES',
		aboutUs: 'VTEA',
		projects: 'VTEP'
	};

	function createPostSection() {
		const state = writable<Post>({
			id: '',
			title: '',
			type: 'news',
			thumbnail: '',
			sections: [],
			createdAt: 0,
			editedAt: 0
		});

		function deleteTrigger(node: HTMLElement) {
			async function handleClick(e: Event) {
				e.preventDefault();
				if (!!node.dataset.postid && !!node.dataset.posttype) {
					const postItem = data.postsByType[node.dataset.posttype].find(
						(post) => post.id === node.dataset.postid
					);
					if (postItem) {
						try {
							let existPhotos = [postItem.thumbnail.split('/').pop() || ''];
							if (postItem.sections?.length && postItem.sections.length > 0) {
								for (const section of postItem.sections) {
									if (section.type === 'image') {
										existPhotos.push(section.content[0].split('/').pop() || '');
									}
								}
							}
							const authKey = localStorage.getItem('authKey');
							const res = await fetch(
								`https://viet_tri_api.mkt-viettri.workers.dev/api/posts/${node.dataset.postid}`,
								{
									method: 'DELETE',
									headers: {
										Authorization: `${authKey}`
									}
								}
							);
							if (res.ok) {
								await Promise.all(existPhotos.map((key) => deleteImage(key)));
								removePost(node.dataset.postid, node.dataset.posttype);
							} else {
								alert('Sai mật khẩu hoặc Server không hoạt động');
							}
						} catch (error) {
							alert('Có lỗi xảy ra, vui lòng thử lại');
						}
					}
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function editTrigger(node: HTMLElement) {
			function handleClick(e: Event) {
				e.preventDefault();
				if (!!node.dataset.postid && !!node.dataset.posttype) {
					const postItem = data.postsByType[node.dataset.posttype].find(
						(post) => post.id === node.dataset.postid
					);
					if (postItem) {
						sections = postItem.sections || [];
						state.update(s => ({
							...postItem
						}));
						
						currentPostType = postItem.type;
						dialogOpen = true;
						
						if (postItem.thumbnail) {
							const fileKey = postItem.thumbnail.split('/').pop() || '';
							thumbnailList = {
								[fileKey]: { 
									url: postItem.thumbnail, 
									state: 'url' 
								}
							};
						}
					}
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function createPostTrigger(node: HTMLElement) {
			function handleClick(e: Event) {

				e.preventDefault();
				if (!!node.dataset.posttype && node.dataset.posttype in typePrefix) {
					dialogOpen = true;
					currentPostType = node.dataset.posttype as 'news' | 'services' | 'aboutUs' | 'projects';
				}
			}
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function removePhotoButton(node: HTMLButtonElement) {
			const handleClick = async (e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				if (!!node.dataset.key) {
					const res = await fetch(
						`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${node.dataset.key}`,
						{
							method: 'GET'
						}
					);
					const resData = (await res.json()) as any;
					if (resData.ok) {
						if (node.dataset.type === 'thumbnail') {
							//@ts-ignore
							inputImage.value = null;
							thumbnailList[node.dataset.key].state = 'deleting';
							await fetch(resData.delUrl, {
								method: 'DELETE'
							});
							delete thumbnailList[node.dataset.key];
							thumbnailList = { ...thumbnailList };
						} else if (node.dataset.type && node.dataset.type.startsWith('section-')) {
							//@ts-ignore
							inputSectionImage.value = null;
							const index = node.dataset.type.split('-').pop();
							if (index) {
								await fetch(resData.delUrl, {
									method: 'DELETE'
								});
								const indexNumber = parseInt(index);
								sections.splice(indexNumber, 1);
								sections = [...sections];
							}
						}
					} else {
						alert('Có lỗi xảy ra');
					}
				}
			};
			node.addEventListener('click', handleClick);
			return {
				destroy() {
					node.removeEventListener('click', handleClick);
				}
			};
		}

		function clickOutside(node: HTMLElement) {
			const handleClick = (event: MouseEvent) => {
				if (!node.contains(event.target as Node)) {
					node.dispatchEvent(new CustomEvent('clickoutside'));
					showSectionDropdown = false;
				}
			};

			document.addEventListener('click', handleClick, true);

			return {
				destroy() {
					document.removeEventListener('click', handleClick, true);
				}
			};
		}

		function addSection(type: Section['type']) {
			const newSection: Section = {
				type,
				content: type === 'space' ? [] : ['']
			};

			if (insertAtIndex >= 0 && insertAtIndex <= sections.length) {
				sections = [
					...sections.slice(0, insertAtIndex),
					newSection,
					...sections.slice(insertAtIndex)
				];
				insertAtIndex = -1;
			} else {
				sections = [...sections, newSection];
			}

			showSectionDropdown = false;

			if (type === 'image') {
				inputSectionImage.click();
			} else {
				setTimeout(() => {
					const newElement = document.querySelector(
						`[data-section-index="${sections.length - 1}"]`
					);
					if (newElement instanceof HTMLElement) {
						newElement.focus();
					}
				}, 0);
			}
		}

		return {
			element: {
				deleteTrigger,
				editTrigger,
				createPostTrigger,
				removePhotoButton,
				addSection,
				clickOutside
			},
			states: { state }
		};
	}

	const {
		element: {
			deleteTrigger,
			editTrigger,
			createPostTrigger,
			removePhotoButton,
			addSection,
			clickOutside
		},
		states: { state }
	} = createPostSection();

	const removePost = (postId: string, postType: string) => {
		data.postsByType[postType] = data.postsByType[postType].filter((post) => post.id !== postId);
		data.postsByType = { ...data.postsByType };
	};

	const formatPostType = (type: string) => {
		const mapping: Record<string, string> = {
			news: 'Tin tức',
			services: 'Dịch vụ',
			aboutUs: 'Về chúng tôi',
			projects: 'Dự án'
		};
		return mapping[type] || type;
	};

	async function uploadFile(file: File, fileName: string, type: string) {
		const res = await fetch(
			`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=geturl&keyname=${fileName}&readExp=${3600 * 24 * 7}`,
			{
				method: 'GET'
			}
		);
		const resData = (await res.json()) as any;
		if (resData.ok) {
			try {
				if (type === 'thumbnail') {
					thumbnailList[fileName] = { url: '', state: 'loading' };
					await fetch(resData.signedUrl, {
						method: 'PUT',
						body: file
					});
					thumbnailList[fileName].state = 'url';
					thumbnailList[fileName].url = resData.objUrl;
				} else if (type === 'section') {
					await fetch(resData.signedUrl, {
						method: 'PUT',
						body: file
					});
					const imageName = `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${fileName}`;
					sections[sections.length - 1].content[0] = imageName;
					sections = [...sections];
				}
			} catch (error) {
				if (type === 'thumbnail') {
					delete thumbnailList[fileName];
					thumbnailList = { ...thumbnailList };
				} else if (type === 'section') {
					delete sections[sections.length - 1];
					sections = [...sections];
				}
			}
		}
	}

	async function handleImageChange(param: string) {
		if (param === 'thumbnail') {
			if (inputImage.files) {
				for (const [key, photo] of Object.entries(inputImage.files)) {
					const fileName = `${crypto.randomUUID()}-${photo.name}`;
					uploadFile(photo, fileName, 'thumbnail');
				}
			}
		}
		if (param === 'section') {
			if (inputSectionImage.files) {
				for (const [key, photo] of Object.entries(inputSectionImage.files)) {
					const fileName = `${crypto.randomUUID()}-${photo.name}`;
					uploadFile(photo, fileName, 'section');
				}
			}
		}
	}

	function addPost(post: Post) {
		data.postsByType[post.type].push(post);
		data.postsByType = { ...data.postsByType };
	}

	async function deleteImage(image: string) {
		const res = await fetch(
			`https://viet_tri_api.mkt-viettri.workers.dev/api/uploadFile/signedUrl?state=delete&delkey=${image}`,
			{
				method: 'GET'
			}
		);
		const resData = (await res.json()) as any;
		if (resData.ok) {
			await fetch(resData.delUrl, {
				method: 'DELETE'
			});
		}
	}

	function resetState() {
		$state = {
			id: '',
			title: '',
			type: activeTab,
			thumbnail: '',
			sections: [],
			createdAt: 0,
			editedAt: 0
		};

		dialogOpen = false;
		currentPostType = activeTab;
		//@ts-ignore
		inputSectionImage.value = null;
		//@ts-ignore
		inputImage.value = null;
		thumbnailList = {};
		showSectionDropdown = false;
		sections = [];
		isPosting = false;
	}

	// function generateCustomShortId(prefix = 'VTEN', length = 6) {
	// 	const randomPart = Math.random().toString(36).substr(2, length);
	// 	return `${prefix}${randomPart}`;
	// }

	async function handleSubmit() {
		if ($state.title && !$state.id) {
			const id = crypto.randomUUID();
			const postId = `${typePrefix[currentPostType]}${id}`;
			$state.id = postId;
		}
		$state.type = currentPostType;
		if (Object.keys(thumbnailList).length > 0) {
			const imageName = Object.keys(thumbnailList)[0];
			const url = `https://pub-4076f91e2c23424590fb9b7fe99e41b5.r2.dev/${imageName}`;
			$state.thumbnail = url;
		}
		$state.sections = sections;
		
		// For new posts, set created time
		if (!$state.createdAt) {
			$state.createdAt = Date.now();
		}
		
		// Always update edited time
		$state.editedAt = Date.now();
		
		if (!isPosting) {
			try {
				isPosting = true;
				const body = { ...$state };
				const authKey = localStorage.getItem('authKey');
				
				// Determine if we're updating an existing post or creating a new one
				const isUpdate = data.postsByType[currentPostType].some(post => post.id === $state.id);
				const endpoint = isUpdate
					? `https://viet_tri_api.mkt-viettri.workers.dev/api/posts/${$state.id}`
					: `https://viet_tri_api.mkt-viettri.workers.dev/api/posts/create`;
				
				const method = isUpdate ? 'PUT' : 'POST';
				
				const res = await fetch(endpoint, {
					method,
					headers: {
						'Content-Type': 'application/json',
						Authorization: `${authKey}`
					},
					body: JSON.stringify(body)
				});
				
				if (res.ok) {
					if (isUpdate) {
						// Update existing post in the local data
						const postIndex = data.postsByType[currentPostType].findIndex(post => post.id === $state.id);
						if (postIndex !== -1) {
							data.postsByType[currentPostType][postIndex] = body;
							data.postsByType = { ...data.postsByType };
						}
					} else {
						// Add new post
						addPost(body);
					}
					resetState();
				} else {
					let existPhotos = [...Object.keys(thumbnailList)];
					if (sections.length > 0) {
						for (const section of sections) {
							if (section.type === 'image') {
								existPhotos.push(section.content[0].split('/').pop() || '');
							}
						}
					}
					if (existPhotos.length > 0) {
						await Promise.all(existPhotos.map((key) => deleteImage(key)));
					}
					resetState();
					alert('Sai mật khẩu hoặc Bài viết đã tồn tại');
				}
			} catch (error) {
				let existPhotos = [...Object.keys(thumbnailList)];
				if (sections.length > 0) {
					for (const section of sections) {
						if (section.type === 'image') {
							existPhotos.push(section.content[0].split('/').pop() || '');
						}
					}
				}
				if (existPhotos.length > 0) {
					await Promise.all(existPhotos.map((key) => deleteImage(key)));
				}
				resetState();
				alert('Có lỗi xảy ra, vui lòng thử lại');
			}
		}
	}

	function autoResize(node: HTMLTextAreaElement) {
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		};

		// Set initial height
		setTimeout(resize, 0);

		// Resize on input
		node.addEventListener('input', resize);

		// Resize when content changes through binding
		const observer = new MutationObserver(resize);
		observer.observe(node, { characterData: true, subtree: true });

		return {
			update: resize,
			destroy: () => {
				node.removeEventListener('input', resize);
				observer.disconnect();
			}
		};
	}
</script>

<div class="container mx-auto px-4 py-8">

	<!-- Create a tab navigation -->
	<div class="mb-6 border-b">
		<div class="-mb-px flex flex-wrap">
			{#each data.postTypes as postType}
				<button
					class="border-b-2 px-4 py-2 text-xl font-medium transition-colors duration-200 {activeTab ===
					postType
						? 'border-blue-500 text-blue-600'
						: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					on:click={() => (activeTab = postType as 'news' | 'services' | 'aboutUs' | 'projects')}
				>
					{formatPostType(postType)}
				</button>
			{/each}
		</div>
	</div>

	<!-- Display only the active tab content -->
	{#each data.postTypes as postType}
		{#if activeTab === postType}
			<section class="mb-12 mt-12">
				<div class="flex w-full items-center justify-between space-x-4">
					<h2 class="mb-6 text-3xl font-bold">{formatPostType(postType)}</h2>
					<div
						use:createPostTrigger
						data-posttype={postType}
						class="flex items-center gap-2 rounded-md bg-blue-500 px-2 py-1 text-white hover:cursor-pointer"
					>
						<CirclePlus class="h-6 w-6" />
						<span class="font-semibold">THÊM BÀI VIẾT</span>
					</div>
				</div>
				<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each data.postsByType[postType] || [] as post (post.id)}
						<div
							class="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-md"
						>
							<div class="absolute right-0 top-0 flex items-center gap-1">
								<div
									use:editTrigger
									data-postid={post.id}
									data-posttype={post.type}
									class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
								>
									<Pencil class="h-6 w-6 text-slate-600" />
								</div>
								<div
									use:deleteTrigger
									data-postid={post.id}
									data-posttype={post.type}
									class="rounded-md border bg-white p-1 hover:cursor-pointer hover:bg-slate-200"
								>
									<Trash2 class="h-6 w-6 text-slate-600" />
								</div>
							</div>
							<img class="h-48 w-full object-cover" src={post.thumbnail} alt={post.title} />
							<div class="p-4">
								<h3 class="text-lg font-semibold text-slate-700">{post.title}</h3>
								{#if post.sections && post.sections.length > 0}
									{#each post.sections.slice(0, 1) as section}
										{#if section.type === 'paragraph' && section.content}
											<p class="mt-2 line-clamp-3 text-sm text-slate-500">
												{section.content.join(' ')}
											</p>
										{/if}
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/each}

	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="h-screen w-full overflow-y-scroll">
			<div >
				<div class="flex flex-col items-center gap-2">
					<div class="p-6">
						<span class="text-2xl font-bold">
							{$state.id ? 'SỬA BÀI VIẾT' : 'THÊM BÀI VIẾT'} - {formatPostType(currentPostType)}
						</span>
					</div>
					<div>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							bind:this={inputImage}
							on:change={async () => await handleImageChange('thumbnail')}
						/>
						<input
							class="hidden"
							type="file"
							accept="image/*"
							bind:this={inputSectionImage}
							on:change={async () => await handleImageChange('section')}
						/>
					</div>
					<div
						class=" relative flex w-full flex-col items-center space-x-4 rounded-md border md:flex-row"
					>
						<div class="flex flex-col items-center">
							{#if Object.keys(thumbnailList).length > 0}
								{#each Object.entries(thumbnailList) as [key, file]}
									<div class="">
										{#if file.state === 'loading' || file.state === 'deleting'}
											<div class="relative aspect-video h-[200px] rounded-md bg-slate-100">
												<div
													class=" absolute inset-0 top-0 ml-[50%] flex w-full -translate-x-[50%] items-center justify-center space-x-2"
												>
													<Loader class=" h-6 w-6 animate-spin text-slate-400" />
													<span class=" text-lg font-medium text-slate-400">{file.state}</span>
												</div>
											</div>
										{/if}
										{#if file.state === 'url'}
											<div class=" relative aspect-video h-[200px]">
												<img
													class="h-full w-full rounded-sm border object-cover object-center"
													height={200}
													src={file.url}
													alt={key}
												/>
												<button
													class=" absolute right-0 top-0 z-10 mr-1 mt-1 rounded-md bg-white p-1 hover:bg-slate-200"
													data-key={key}
													data-type="thumbnail"
													use:removePhotoButton
												>
													<Trash2 class="h-6 w-6 text-slate-700" />
												</button>
											</div>
										{/if}
									</div>
								{/each}
							{:else}
								<div
									class="flex aspect-video h-[200px] items-center justify-center bg-gray-100 text-center"
								>
									<div>
										<button
											class=" flex h-full w-full items-center space-x-2 rounded-md border px-4 py-2 hover:bg-slate-200"
											on:click|preventDefault={() => {
												inputImage.click();
											}}
										>
											<Image class="h-[30px] w-[30px] text-gray-400" />
											<span class="text-2xl font-semibold text-gray-300"> Thumbnail </span>
										</button>
									</div>
								</div>
							{/if}
						</div>
						<textarea
							bind:value={$state.title}
							placeholder="Tiêu đề bài viết..."
							class=" h-[100px] w-full px-8 py-4 text-2xl font-semibold text-gray-800 outline-none placeholder:text-slate-400"
							required
						>
						</textarea>
					</div>
					<!-- <div class="flex items-center justify-between space-x-4">
						<span class="whitespace-nowrap text-sm font-medium text-slate-500"
							>Phân loại bài đăng * :</span
						>
						<select bind:value={currentPostType} class="block h-[32px] w-full rounded-md border">
							<option value="news">Tin tức</option>
							<option value="services">Dịch vụ</option>
							<option value="aboutUs">Về chúng tôi</option>
							<option value="projects">Dự án</option>
						</select>
					</div> -->
					<!-- <span class="whitespace-nowrap font-medium text-slate-500">Nội dung bài viết :</span> -->
					<div
						class="relative flex min-h-[400px] w-full flex-col gap-2 rounded-md border px-6 pb-[140px] pt-10"
					>
						{#if sections.length > 0}
							{#each sections as section, index (index)}
								<div class="group relative">
									{#if section.type === 'paragraph'}
										<textarea
											data-section-index={index}
											bind:value={section.content[0]}
											use:autoResize
											class="min-h-[24px] w-full overflow-hidden px-8 py-0 leading-tight outline-none"
											placeholder="Nhập nội dung đoạn văn..."
										></textarea>
									{:else if section.type === 'header'}
										<textarea
											data-section-index={index}
											class="min-h-[36px] w-full resize-none overflow-hidden border-none px-8 py-0 text-3xl font-bold leading-tight outline-none"
											bind:value={section.content[0]}
											placeholder="Nhập tiêu đề lớn..."
											use:autoResize
										></textarea>
									{:else if section.type === 'subheader'}
										<textarea
											data-section-index={index}
											class="min-h-[32px] w-full resize-none overflow-hidden border-none px-8 py-0 text-2xl font-semibold leading-tight outline-none"
											bind:value={section.content[0]}
											placeholder="Nhập tiêu đề nhỏ..."
											use:autoResize
										></textarea>
									{:else if section.type === 'bulletList'}
										<div class="flex flex-col gap-0 px-8">
											{#each section.content || [''] as item, itemIndex}
												<div class="mb-0 flex items-start gap-2">
													<span class="mt-0 text-xl">•</span>
													<textarea
														data-section-index={index}
														class="min-h-[24px] flex-1 resize-none overflow-hidden border-none py-0 leading-tight outline-none"
														bind:value={item}
														placeholder="Nhập mục danh sách..."
														use:autoResize
													></textarea>
												</div>
											{/each}
											<button
												class="ml-6 mt-0 self-start text-blue-500 hover:text-blue-600"
												on:click|preventDefault={() => {
													if (section.content) {
														section.content = [...section.content, ''];
														sections = sections;
													}
												}}
											>
												+ Thêm mục
											</button>
										</div>
									{:else if section.type === 'space'}
										<div class="h-10"></div>
									{:else if section.type === 'image'}
										<div class="relative w-fit">
											<img
												class=" max-h-[500px] object-contain"
												height={500}
												src={section.content[0]}
												alt={section.content[0]}
											/>
											<button
												class=" absolute right-0 top-0 z-10 mr-1 mt-1 rounded-md bg-white p-1 hover:bg-slate-200"
												data-key={section.content[0].split('/').pop()}
												data-type={`section-${index}`}
												use:removePhotoButton
											>
												<X class="h-6 w-6 text-slate-700" />
											</button>
										</div>
									{/if}

									<!-- Section controls - appear on hover -->
									<div
										class="absolute left-0 top-0 -ml-12 flex items-center rounded-md bg-slate-200 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<!-- Move Up button - disabled for first item -->
										<button
											aria-label="Move Up"
											class="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500"
											disabled={index === 0}
											on:click={() => {
												if (index > 0) {
													// Swap with previous section
													const newSections = [...sections];
													[newSections[index - 1], newSections[index]] = [
														newSections[index],
														newSections[index - 1]
													];
													sections = newSections;
												}
											}}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M18 15l-6-6-6 6" />
											</svg>
										</button>

										<!-- Move Down button - disabled for last item -->
										<button
											aria-label="Move Down"
											class="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500"
											disabled={index === sections.length - 1}
											on:click={() => {
												if (index < sections.length - 1) {
													// Swap with next section
													const newSections = [...sections];
													[newSections[index], newSections[index + 1]] = [
														newSections[index + 1],
														newSections[index]
													];
													sections = newSections;
												}
											}}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M6 9l6 6 6-6" />
											</svg>
										</button>

										<!-- Delete button -->
										{#if section.type !== 'image'}
											<button
												aria-label="Delete"
												class="p-1 text-gray-500 hover:text-red-600"
												on:click={() => {
													sections.splice(index, 1);
													sections = [...sections];
												}}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<path d="M3 6h18" />
													<path
														d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
													/>
												</svg>
											</button>
										{/if}
									</div>
								</div>
							{/each}
						{/if}

						<!-- Replace the current Add Section dropdown with this fixed toolbar -->
						<div
							class=" absolute bottom-0 left-0 flex w-full items-center justify-center rounded-md border bg-white p-2 shadow-sm"
						>
							<span class="mr-4 text-sm font-medium text-slate-600">Thêm phần:</span>
							<div class="flex flex-wrap gap-2">
								{#each sectionTypes as { type, label }}
									<button
										class="flex flex-col items-center rounded-md p-2 hover:bg-slate-100"
										title={label}
										on:click={() => addSection(type)}
									>
										{#if type === 'paragraph'}
											<!-- Paragraph icon -->
											<Pilcrow class=" h-[24px] w-[24px] text-slate-600" />
										{:else if type === 'header'}
											<!-- Heading icon for Tiêu đề lớn -->
											<Heading1 class=" h-[24px] w-[24px] font-bold text-slate-600" />
										{:else if type === 'subheader'}
											<!-- Heading icon for Tiêu đề nhỏ (smaller variant) -->
											<Heading2 class=" h-[24px] w-[24px] font-light text-slate-600" />
										{:else if type === 'bulletList'}
											<!-- List icon -->
											<List class=" h-[24px] w-[24px] text-slate-600" />
										{:else if type === 'image'}
											<!-- Image icon -->
											<Image class=" h-[24px] w-[24px] text-slate-600" />
										{:else if type === 'space'}
											<!-- Space icon -->
											<Space class=" h-[24px] w-[24px] text-slate-600" />
										{/if}
										<span class="mt-1 text-xs">{label}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
				<div class="mt-10 flex justify-end">
					<button on:click={async () => await handleSubmit()} class="rounded-md bg-blue-500 px-4 py-2 text-white"
						>{$state.id ? 'Cập nhật bài viết' : 'Đăng bài viết'}</button
					>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>

	{#if showSectionDropdown}
		<div
			class="fixed z-50 mt-1 w-48 rounded-md border bg-white shadow-lg"
			style="left: {insertAtIndex >= 0 ? '40px' : 'auto'}; top: {(() => {
				if (insertAtIndex >= 0) {
					const el = document.querySelector(`[data-section-index="${insertAtIndex - 1}"]`);
					if (el) {
						return `${el.getBoundingClientRect().bottom + window.scrollY}px`;
					}
					return '100px';
				}
				return 'auto';
			})()}"
			use:clickOutside
		>
			{#each sectionTypes as { type, label }}
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100"
					on:click={() => addSection(type)}
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}
</div>
